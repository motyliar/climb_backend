const Message = require('../../models/Message/message_model');
const { singleUserModel, messageModel } = require('../../models/Message/message_sub_models');
const ServerMessage = require('../../core/servermessage');
const { errorHandle } = require('../../middlewere/error_handle');
const  MessageHelpers = require('./messages_helpers');
const mongoose = require('mongoose');
const { ObjectId} = require('mongodb');


const SEND_DIRECTION = "send";
const RECEIVED_DIRECTION = "received";

class MessageActions {
   
    /**
     * Find single messages field (send/received) by req.params
     * @function GET
     * @param {fieldName} req.params to store name of field
     * @returns {object} - message data 
     */
    async findOneField (req, res) {
        const { fieldName } = req.params;
        try {
            const data = await Message.findOne({'fieldName' : fieldName});
      if  (!data) {
            res.status(404).json({message: ServerMessage.notFound});
        } else {
        res.status(200).json(data);}
        } catch(error) {
            res.status(500).json(errorHandle(error));
        }
        
    }
    /**
     * Send new message to user/friend and return to sender send table
     * @function POST
     * 
     */
    async sendMessageUser (req, res) {
        const { id } = req.params;
        const recipientMessage = new messageModel(req.body);
        const senderMessage = new messageModel({"to" : req.body.from , "from" : req.body.to, "subject" : req.body.subject, "content" : req.body.content});
        const recipient = req.body.to;
        const sender = req.body.from;

        try {
            const user = await MessageHelpers.sendSingleMessage(SEND_DIRECTION, recipient, recipientMessage);
            if(user) {
                const returnMessage = await MessageHelpers.sendSingleMessage(RECEIVED_DIRECTION, sender, senderMessage);
               
                if(returnMessage) {
                res.status(200).json({message: ServerMessage.success});} else {
                    res.status(404).json({message: ServerMessage.userNotFound});
                }

            } else {
                res.status(404).json({message: ServerMessage.userNotFound});
            }
        } catch(error) {
            res.status(500).json({message: error});
        }

       
    }
    /**
     * Sending one message to multiple users
     * @function POST
     * @return {Message} success or failed
     */
    async sendMessageToMultilpeUsers (req, res) {
        const direction = req.body.direction;
        const recipients = req.body.recipient;
        const recipientMessage = new messageModel(req.body.message);
        const senderMessage = new messageModel({"to" : req.body.from , "from" : req.body.to, "subject" : req.body.subject, "content" : req.body.content});
        const sender = req.body.message.from;

        const result = await MessageHelpers.sendMessageToMultipleUser(direction, recipients, recipientMessage);
        if (result) {
          res.json(result);
        } else {
          res.json({message: ServerMessage.notFound});
        }

       
        

    } 
    /**
     * Get all data from Message
     * @function GET
     * @returns {messagesData} - complete data form Message object
     */
    async getMessageTable (req, res) {
        try {
            const messagesData = await Message.find({});
            res.status(200).json(messagesData);
        } catch(e) {
            res.status(500).json({message: e});
        }
    }
    /**
     * Geting single user messages
     * @function GET
     * @return {Object} user messages
     */

    async getUser(req,res) {
      const userID = req.params.id;
      const direction = req.body.direction;
      
      try {
        const result = await MessageHelpers.getSingleUserMessages(direction, userID);
        if(result) {
          res.status(200).json(result)
        } else {
          res.status(404).json({message: ServerMessage.userNotFound});
        } 
      } catch(error) {
        res.status(500).json({error: errorHandle(error)});
      }
    }
    /**
     * Get a certain number of messages
     * @function PAGINATION
     * @return {object} certain messages
     */
    async getUserMessagesPagination(req,res) {
        const userID = req.params.id;
        const direction = req.query.direction;
        const page = req.query.page;
        const pageSize = req.query.size;

        try {
          const user = await MessageHelpers.getSingleUserMessages(direction, userID);
          if(user)
          {
          console.log(user[0].messages)
          const messageCount = user[0].messages.length;
          const totalPages = Math.ceil(messageCount / pageSize);
          if(page < 1 || page > totalPages) {
            return res.status(400).json({message: ServerMessage.params});
        } else {
          const startIndex = (page - 1) * pageSize;
                        const endIndex = page * pageSize;
                        
                        const paginatedMessages = user[0].messages.slice(startIndex, endIndex);
                        res.status(200).json(paginatedMessages);
        }

          } else{ 
            res.status(404).json({message: ServerMessage.userNotFound});
          }

    } catch(error) {
      res.status(500).json({error: errorHandle(error)}); 
    }
    }
    /**
     * Creating new user in message user array
     * @function POST
     * @param {newUser} - is req.body to store new user
     * @param {req.query.get} - store fieldName of message table
     * @param {req.query.return} - store fieldName of message table
     * @returns {send, received} - Arrays with new user
     */ 
    async madeUserTable (req, res) {
        
        const newUser = new singleUserModel({
                "userID" : req.body.userID, "userEmail" : req.body.userEmail
        });
       
        try {
            
            const send = await Message.findOne({"fieldName" : req.query.get});
            const received = await Message.findOne({"fieldName" : req.query.return});
           
            
            if(!send && !received) {
                res.status(404).json({message: ServerMessage.notFound});
            } else {
            send.user.push(newUser);
            await send.save();
            received.user.push(newUser);
            await received.save();
            res.status(201).json({send: send, received: received});
            
        } } catch(err) {
            res.status(500).json({message: err});
        }
       
    }
    /**
     * Creating new Message object
     * @notes - Only for Admin function
     * @param {newField} - creating new message object
     * @returns {newField} - return new object
     */
    async createMessageTable(req,res) {
        const newField = await Message.create(req.body);
        res.status(200).json(newField);
       
        } 

      /** 
       * Deleting single message from User data
       * @function delete
       * @param {req} req.body transits user id
       * @param {req} req.query.remove transimts message id to remove
       * 
     */  
    async deleteSingleMessageFromData(req,res) {
        const { id } = req.params;
        console.log(id);

        const direction = req.query.direction;
        console.log(direction);
        const messageIdToRemove = req.query.remove;
        console.log(messageIdToRemove);
        try {
            const result = await Message.findOneAndUpdate({
                 "fieldName": "send","user.userID" : "12344" }, 
                 {$pull: {'user.$.messages': {"_id": "6572274bd932ef50f7f3fc0b"}}}, {new: true}
                 

            ); console.log(result);
                if (result.nModified > 0) {
                    res.status(200).json({message: ServerMessage.success});
                } else {
                    res.status(404).json({message: ServerMessage.notFound});
                }
         } catch(error) {
            res.status(500).json(errorHandle(error));
         }

    }
    async findSingleMessage(req,res) {
      const userID = req.params.id;
      const direction = req.body.direction;
      const message = req.body.message;
      console.log(message);
        const result = await Message.aggregate([
            {$match: {
                "fieldName" : direction,
                "user.userID" : userID
            }},
            {$project: {
              user: {
                $filter: {
                  input: "$user", as: "u", cond: {$eq: ["$$u.userID", userID]}
                }
              }
            }},
            {$unwind: "$user"}, 
            { $project: {
              user: {
                userID: "$user.userID",
                userEmail: "$user.userEmail",
                messages: {
                  $filter: {
                    input: "$user.messages", as: "m",
                    cond: {$eq: ["$$m._id", new ObjectId(message)]}
                  }
                }
              }
            }}
        ]);
       
        res.json(result);
    }
   
   /**
    * Function for delete one message from user
    * @function deleteOne
    * @param {string} userID 
    * @param {string} messageIdToRemove 
    * @returns {Object} catch modifiedCount from updateOne to check what changed 
    */
   async deleteOne (req,res) {
    const userID = req.params.id;
    const messageIdToRemove = req.body.messageId; 
    const direction = req.body.direction;

try {
    const result = await Message.updateOne(
        { "fieldName": direction, "user.userID": userID },
        { $pull: { "user.$.messages": { _id: new ObjectId(messageIdToRemove) } } },
        // {arrayFilters: [{ 'elem.userID': '12344'}]},
        );
        const update = await MessageHelpers.getSingleUserMessages(direction, userID);
        
  if (result.modifiedCount > 0) {
    res.json({ message: ServerMessage.success, update: update});
  } else {
    res.json({ message: ServerMessage.notFound });
  }
} catch (error) {
  
  res.status(500).json({ error: errorHandle(error) });
}
   }
    /**
     * Delete many messages from user message arrray
     * @function DELETE 
     * @param {string} userID 
     * @param {Array<string>} messageIDsToRemove 
     * @param {string} direction
     * @returns {object} return message of success or failed and new updated object 
     */
   async deleteFew (req,res) {
    const userID = req.params.id;
    const messageIDToRemove = req.body.messageIds; 
    const direction = req.body.direction
try {
    const result = await Message.updateOne(
        { "fieldName": direction, "user.userID" : userID,    },
        { $pull: { "user.$.messages": { _id: {$in: messageIDToRemove.map(id => new ObjectId(id))} } } },
        ); 
       const update = await MessageHelpers.getSingleUserMessages(direction, userID);
            
  if (result.modifiedCount > 0) {
    res.json({ message: ServerMessage.success, update: update });
  } else {
    res.json({ message: ServerMessage.notFound, update: update });
  }
} catch (error) {

  res.status(500).json({ error: errorHandle(error)});
}
   }
   /**
    * Update one message
    * @function UPDATE
    * @returns {object} updated message
    */

    async updateOneMessage(req,res) {
      const userID = req.params.id;
      const direction = req.body.direction;
      const update = req.body.update;
      const messageId = req.body.messageId;
      const field =req.body.field;
      try {
        const result = await Message.updateOne(
            {
                "fieldName": direction,
                "user.userID": userID,
                "user.messages._id": new ObjectId(messageId)
            },
            { $set: { [`user.0.messages.$.${field}`]: update } },

        );

        const newValues = await MessageHelpers.getSingleMessage(direction, userID, messageId);

        if (result.modifiedCount > 0) {
            res.json({ message: ServerMessage.success, result: result.modifiedCount, new: newValues });
        } else {
            res.json({ message: ServerMessage.notFound });
        }
    } catch (error) {
        res.status(500).json({ error: errorHandle(error) });
    }
  }
  }




module.exports = new MessageActions();


