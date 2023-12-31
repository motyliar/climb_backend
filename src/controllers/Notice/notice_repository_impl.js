const NoticeRepository = require('./notice_repository');
const Notice = require('../../models/Notice/notice_model');
const ServerError = require('../../core/errors');
const ServerMessage = require('../../core/servermessage');
const Utils = require('../../core/Utils/utils');


class NoticeRepositoryImpl extends NoticeRepository {
    constructor() {
        super();
        this.notice = Notice;
    }

    /**
     * @Overriden
     * @GET FUNCTIONS
     */
    async getNotices() {
        try {
            const data = await Notice.find({});
        if(data) {
            return data
        } 
        else {
            return null;
        }
        } catch (error) {
            throw  Error('Database query failed');
        }
    } 

    async getSingleNotice(id) {

        try {
            const data = await Notice.findById(id);
        if(data) {
            return data;
        }
        } catch (error) {
            Utils.errorSwitch(error);
            
        }
    }

    async getNoticesByPagination(page, pageSize) {
        const data = await Notice.find({});
        try {
            if(data) {
                return Utils.paginationHelper(page, pageSize, data);
       
               } else {
                   throw Error(ServerMessage.fail);
               }
        } catch (error) {
            throw new Error(ServerMessage.fail);
        }
    }

    async paginationNoticesByFieldName(page, pageSize, fieldParrent, fieldChild) {
       
            const data = await Notice.where(fieldParrent).equals(fieldChild);
       
        try {
            if(data) {
               return  Utils.paginationHelper(page, pageSize, data);
            } else {
                throw new Error(ServerMessage.fail);
            }
        } catch(error) {
            throw new Error(ServerMessage.fail);
        }
    }

    async findNoticeCreatedByUser(userId) {
        try {
            const data = await Notice.where("authorId").equals(userId);
            if(data) {
                return data;
            }
        } catch(error) {
            Utils.errorSwitch(data);
        }
    }
    /**
     * @Oveririden
     * @POST FUNCTIONS
     */
    async createNotice(notice) {
    
        const data = await Notice.create(notice);
        if(data) {
            return data;
        } else {
            throw Error('Database query failed');
        }

    }
    async addComment( id, comment) {

        const data = await Notice.updateOne({"_id": id}, {$push: {"comments" : comment}, $set: {"updatedAt": Utils.getData()}});
        if(data) {
            return data;
        } else {
            return null;
        }
    }
    /**
     * @Overriden
     * @DELETE FUNCTIONS
     */
    async deleteSingleNotice(id) {
       
        try {
            const data = await Notice.findByIdAndDelete(id);

            if(data) {
                return data;
            } 

        } catch (error) {
            Utils.errorSwitch(error);
        }
    }
    async deleteManyNotices(idList) {
        try {
            const data = await Notice.deleteMany({_id: {$in: idList}});
            if(data) {
                return data;
            } 
        } catch(error) {
            return null;
        }
    }

    async deleteSingleComment(noticeId , userId) {
        try {
            const data = await Notice.updateOne(
                {"_id" : noticeId, "comments._id" : userId},
                {$pull: {"comments": {"_id" : userId} } }
                );
                if(data.modifiedCount > 0) {
                    return {"status" : ServerMessage.success}
                } else null;
        }
        catch(error) {
           Utils.errorSwitch(error);
        }
    }

    /**
     * @Overriden
     * @UPDATE
     */
    async updateNoticeContent(noticeId, field, content) {
      try {
        const data = await Notice.updateOne(
            {"_id": noticeId,}, 
            {$set: {[`content.${field}`]: content }, "updatedAt": Utils.getData()}
            );
            if(data.modifiedCount > 0) {
                return {"status": ServerMessage.success}
            } else {
                null;
            }
      } catch (error) {
        Utils.errorSwitch(error);
      }
    }


    async updateOneComment(noticeId, commentId, newContent) {

        const data = await Notice.updateOne(
            { "_id" : noticeId, "comments._id" : commentId}, 
            { $set: {"comments.$.content" : newContent, "comments.$.updatedAt" : Utils.getData() },
            
            "updatedAt": Utils.getData()}
            );
            if(data) {
                return data;

            } else {
                return null;
            }
    }
}





module.exports = NoticeRepositoryImpl;