import Survey from "@models/surveyModel";
import to from "await-to-ts";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  const {
    first,
    second,
    third,
    fourth,
    fifth,
    six,
    seven,
    eight,
    nine,
    ten,
    eleven,
    twelve,
    thirteen,
    fourteen,
    fifteen,
    sixteen,
    seventeen,
    eighteen,
    nineteen
  } = req.body;

  const [error, survey] = await to(
    Survey.create({
      user: userId,
      first,
      second,
      third,
      fourth,
      fifth,
      six,
      seven,
      eight,
      nine,
      ten,
      eleven,
      twelve,
      thirteen,
      fourteen,
      fifteen,
      sixteen,
      seventeen,
      eighteen,
      nineteen
    })
  );

  if (error) return next(error);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Survey created successfully",
    data: survey
  });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.params.id;
  const [error, survey] = await to(Survey.findOne({ user: userId }));

  if (error) return next(error);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Surveys retrieved successfully",
    data: survey
  });
};

const SurveyController = {
  create,
  get
};

export default SurveyController;
