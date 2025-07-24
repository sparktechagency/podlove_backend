import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    //  const notificationMessage = `Your podcast "${podcast.title}" is scheduled for ${date} at ${time}.`;
    // const notification = new Notification({
    //   type: 'podcast_scheduled',
    //   user: userId,             // <-- associate to the user (if you track it)
    //   message: notificationMessage,
    //   read: false,
    //   section: 'user',
    // });
    const podcast = { title: "The Future of AI" };
    const date = "2025-08-01";
    const time = "3:00 PM";
    const message = 
      {
        title: `${podcast.title}`,
        description:  `Your podcast is scheduled for ${date} at ${time}`
      }
      
      
    
    const notification = [{
      type: "podcast_scheduled",
      user: "68600f666d611e9e83e68e1c",
      message: message,
      read: false,
      section: "user",
    }];

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Schedule updated and notification created successfully",
      data: {
        //   podcast,
        notification,
      },
    });
  } catch (err) {
    next(err);
  }

  // return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: { notifications: [] } });
};

const updateRead = async(req:Request, res:Response, next:NextFunction): Promise<any> =>
{
  try{

  }catch(err){
    next(err);
  }
}

const NotificationController = {
  get,
  updateRead
};

export default NotificationController;
