import type { ImportRepository } from '../repository/ImportRepository';
import type { ImportFileService } from './ImportFileService';
import type { CampusRepository } from '../repository/CampusRepository';
import type { CatalogRepository } from '../repository/CatalogRepository';
import { ContestRepository, FeedbackRepository, PublicityRepository } from '../repository/Repositories';
import { SessionService } from './SessionService';
class AdminServices {
 private imports:ImportRepository|null=null;
 private importFiles:ImportFileService|null=null;
 configureImports(repository:ImportRepository,files:ImportFileService):void{this.imports=repository;this.importFiles=files;}
 getImports():ImportRepository{if(!this.imports)throw new Error('文件导入服务未配置');return this.imports;}
 getImportFiles():ImportFileService{if(!this.importFiles)throw new Error('文件接收服务未配置');return this.importFiles;}
 private managementSchool:string|null=null;
 setManagementSchool(id:string|null):void{this.managementSchool=id;}
 getManagementSchool():string|null{return this.managementSchool;}
 private campus:CampusRepository|null=null;
 configureCampus(campus:CampusRepository):void{this.campus=campus;}
 getCampus():CampusRepository{if(!this.campus)throw new Error('高校服务未配置');return this.campus;}
 private catalog:CatalogRepository|null=null;
 private contests:ContestRepository|null=null;
 private feedback:FeedbackRepository|null=null;
 private publicity:PublicityRepository|null=null;
 private session:SessionService|null=null;
 configure(contests:ContestRepository,feedback:FeedbackRepository,publicity:PublicityRepository,session:SessionService,catalog?:CatalogRepository):void {this.contests=contests;this.feedback=feedback;this.publicity=publicity;this.session=session;this.catalog=catalog||null;}
 getCatalog():CatalogRepository{if(!this.catalog)throw new Error('目录服务未配置');return this.catalog;}
 getContests():ContestRepository{if(!this.contests)throw new Error('赛事服务未配置');return this.contests;}
 getFeedback():FeedbackRepository{if(!this.feedback)throw new Error('反馈服务未配置');return this.feedback;}
 getPublicity():PublicityRepository{if(!this.publicity)throw new Error('公示服务未配置');return this.publicity;}
 getSession():SessionService{if(!this.session)throw new Error('登录服务未配置');return this.session;}
}
export const adminServices=new AdminServices();
