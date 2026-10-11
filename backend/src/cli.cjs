const fs=require('node:fs'),path=require('node:path');
const {Database}=require('./database.cjs');
const {DomainStore}=require('../build/DomainStore');
const {makeSeeds,makeUsers,makeOrganizations}=require('../build/DemoSeeds');
const roles=['学生','信息整理人员','主办方','管理员'];
function seedDemo(database,password='demo123'){
 if(database.db.prepare('SELECT count(*) AS count FROM users').get().count)throw Error('数据库已有账号，拒绝覆盖；演示种子仅用于空数据库');
 database.begin();try{const s=new DomainStore();s.users=makeUsers();s.organizations=makeOrganizations();makeSeeds(s);for(const user of s.users)database.addUser(user,password);database.save(s);database.commit();}catch(e){database.rollback();throw e;}
}
if(require.main===module){
 const filename=process.env.DB_PATH||'./data/jingzhi.sqlite';const command=process.argv[2];const database=new Database(filename);
 try{
  if(command==='seed-demo'){seedDemo(database,process.env.JINGZHI_DEMO_PASSWORD||'demo123');console.log('已初始化演示账号和18条演示赛事。仅用于开发，请勿作为正式数据库。');}
  else if(command==='user-add'){const [id,schoolId,role]=process.argv.slice(3);const password=process.env.JINGZHI_NEW_USER_PASSWORD;if(!id||!schoolId||!roles.includes(role)||!password||password.length<10||password.length>256)throw Error('用法: npm run user:add -- <account> <schoolId> <role>; JINGZHI_NEW_USER_PASSWORD必须为10至256字符');database.addUser({id,schoolId,role,openid:null,subscribes:[],devices:[]},password);console.log('账号已创建: '+id);}
  else if(command==='backup'){const destination=process.argv[3];if(!destination||fs.existsSync(destination))throw Error('请提供一个尚不存在的备份文件路径');fs.mkdirSync(path.dirname(path.resolve(destination)),{recursive:true});database.db.exec("VACUUM INTO '"+destination.replaceAll("'","''")+"'");console.log('备份已生成: '+destination);}
  else throw Error('支持命令: seed-demo, user-add, backup');
 }catch(e){console.error(e.message);process.exitCode=1;}finally{database.close();}
}
module.exports={seedDemo};
