// One-time migration of canonical source. Subsequent sync scripts copy the explicit fields.
const ts = require('../admin-web/node_modules/typescript');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let count = 0;
for (const filename of fs.readdirSync(path.join(root, 'shared')).filter(x => x.endsWith('.ts'))) {
 const full = path.join(root, 'shared', filename);
 const source = ts.createSourceFile(full, fs.readFileSync(full, 'utf8'), ts.ScriptTarget.Latest, true);
 let changed = false;
 const transform = context => {
  const f = context.factory;
  const visit = node => {
   if (ts.isClassDeclaration(node)) {
    const fields = [];
    const members = node.members.map(member => {
     if (!ts.isConstructorDeclaration(member)) return member;
     const assignments = [];
     const parameters = member.parameters.map(parameter => {
      const property = (parameter.modifiers || []).some(m => [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.PublicKeyword, ts.SyntaxKind.ProtectedKeyword, ts.SyntaxKind.ReadonlyKeyword].includes(m.kind));
      if (!property) return parameter;
      if (!ts.isIdentifier(parameter.name) || !parameter.type) throw new Error('Unsupported parameter property in ' + filename);
      changed = true; count++;
      fields.push(f.createPropertyDeclaration(parameter.modifiers, parameter.name, undefined, parameter.type, undefined));
      assignments.push(f.createExpressionStatement(f.createBinaryExpression(f.createPropertyAccessExpression(f.createThis(), parameter.name), f.createToken(ts.SyntaxKind.EqualsToken), f.createIdentifier(parameter.name.text))));
      return f.updateParameterDeclaration(parameter, undefined, parameter.dotDotDotToken, parameter.name, parameter.questionToken, parameter.type, parameter.initializer);
     });
     if (!assignments.length) return member;
     const statements = [...member.body.statements];
     const superIndex = statements.findIndex(s => ts.isExpressionStatement(s) && ts.isCallExpression(s.expression) && s.expression.expression.kind === ts.SyntaxKind.SuperKeyword);
     statements.splice(superIndex + 1, 0, ...assignments);
     return f.updateConstructorDeclaration(member, member.modifiers, parameters, f.updateBlock(member.body, statements));
    });
    return f.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, [...fields, ...members]);
   }
   return ts.visitEachChild(node, visit, context);
  };
  return node => ts.visitNode(node, visit);
 };
 const transformed = ts.transform(source, [transform]);
 if (changed) fs.writeFileSync(full, ts.createPrinter({newLine:ts.NewLineKind.LineFeed}).printFile(transformed.transformed[0]));
 transformed.dispose();
}
console.log('Expanded ' + count + ' constructor parameter properties');
