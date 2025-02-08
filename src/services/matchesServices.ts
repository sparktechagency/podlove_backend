import { NextFunction, Request, Response } from "express";
import User from "@models/userModel";
import to from "await-to-ts";
import { BodyType, Ethnicity, Gender } from "@shared/enums";

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


const findMatchingUsers = async (currentUser: any) => {
  const query: any = {};

  query["gender"] = { $in: currentUser.preferences.gender };

  query["age"] = { $gte: currentUser.preferences.age.min, $lte: currentUser.preferences.age.max };

  query["bodyType"] = { $in: currentUser.preferences.bodyType };

  query["ethnicity"] = { $in: currentUser.preferences.ethnicity };

  if (currentUser.preferences.distance > 0) {
    const matchingUsers = await User.find(query).exec();
    const filteredUsers = matchingUsers.filter((user) => {
      const distance = calculateDistance(
        currentUser.location.latitude,
        currentUser.location.longitude,
        user.location.latitude,
        user.location.longitude
      );
      return distance <= currentUser.preferences.distance;
    });
    return filteredUsers;
  }

  const matchingUsers = await User.find(query).exec();
  return matchingUsers;
};

const currentUser = {
  preferences: {
    gender: [Gender.FEMALE],
    age: { min: 25, max: 35 },
    bodyType: [BodyType.SLIM, BodyType.AVERAGE],
    ethnicity: [Ethnicity.WHITE ],
    distance: 50,
  },
  location: { latitude: 40.7128, longitude: -74.0060 },
};

findMatchingUsers(currentUser)
  .then(users => console.log("Matching users:", users))
  .catch(error => console.error("Error finding users:", error));


const match = async (userId: String): Promise<any> => {

  let error, user, matchedUsers;
  [error, user] = await to(User.findById(userId));
  if (error) throw error;

  [error, matchedUsers] = await to(User.aggregate([
    { $match: { _id: { $ne: userId } } },
    { $project: { _id: 1 } },
    { $sample: { size: 3 } }
  ]));
  if (error) throw error;

  let matches: string[] = [];
  matches.push(matchedUsers[0]._id as string);
  matches.push(matchedUsers[1]._id as string);
  matches.push(matchedUsers[2]._id as string);

  return matches;
};

const matchedUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  // const userId = req.params.id;
  // const [error, user] = await to(User.findById(userId)
  //   .populate({ path: "first", select: "bio interests" })
  //   .populate({ path: "second", select: "bio interests" })
  //   .populate({ path: "third", select: "bio interests" })
  //   .lean());
  // if (error) return next(error);
  // if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found"));
  // return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: user.matches });
};

const MatchedServices = {
  match,
  matchedUsers
};

export default MatchedServices;