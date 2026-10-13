import { StudentSchoolPage, StudentSchoolQuery, StudentSchoolContext, SelectStudentSchoolRequest } from './contracts';
/** Home school is read-only. Selection changes public browsing scope only. */
export interface StudentSchoolRepository {
 listSchools(filter: StudentSchoolQuery): Promise<StudentSchoolPage>;
 getContext(): Promise<StudentSchoolContext>;
 selectSchool(input: SelectStudentSchoolRequest): Promise<StudentSchoolContext>;
}
