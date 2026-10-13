import { StudentSchoolPage, StudentSchoolQuery, StudentSchoolContext, SelectStudentSchoolRequest } from '../models/contracts';
import { StudentSchoolRepository } from './StudentSchoolRepository';
import { HttpTransport, queryPair, querySuffix } from './HttpProtocol';
export class HttpStudentSchoolRepository implements StudentSchoolRepository {
 private transport: HttpTransport;
 constructor(transport: HttpTransport) { this.transport = transport; }
 async listSchools(filter: StudentSchoolQuery): Promise<StudentSchoolPage> {
  const path: string = '/student/schools' + querySuffix([queryPair('keyword', filter.keyword), queryPair('page', filter.page), queryPair('pageSize', filter.pageSize)]);
  return this.transport.request<StudentSchoolPage>('GET', path);
 }
 async getContext(): Promise<StudentSchoolContext> { return this.transport.request<StudentSchoolContext>('GET', '/student/school-context'); }
 async selectSchool(input: SelectStudentSchoolRequest): Promise<StudentSchoolContext> { return this.transport.request<StudentSchoolContext>('PUT', '/student/school-selection', JSON.stringify(input)); }
}
