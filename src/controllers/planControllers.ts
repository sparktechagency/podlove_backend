import Stripe from "stripe";
import "dotenv/config";
import to from "await-to-ts";
import createError from "http-errors";
import { NextFunction, Request, Response } from "express";
import Plan from "@models/planModel";
import { StatusCodes } from "http-status-codes";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, description, unitAmount, interval } = req.body;

  let error, product, price, plan;

  [error, product] = await to(
    stripe.products.create({
      name: name!,
      description: description,
    })
  );
  if (error) return next(error);

  [error, price] = await to(
    stripe.prices.create({
      product: product.id,
      unit_amount: Number.parseFloat(unitAmount) * 100,
      currency: "usd",
      recurring: {
        interval: interval!,
      },
    })
  );
  if (error) return next(error);

  [error, plan] = await to(
    Plan.create({
      name: name,
      description: description,
      unitAmount: Number.parseFloat(unitAmount),
      interval: interval,
      productId: product.id,
      priceId: price.id,
    })
  );
  if (error) return next(error);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Success",
    data: plan,
  });
};

// const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   const userId = req.params.id;
//   const [error, plan] = await to(Plan.findOne({userId:userId}).lean());
//   if (error) return next(error);
//   if (!plan) return next(createError(StatusCodes.NOT_FOUND, "Plan not found!"));
//   return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: plan });
// };

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.params.id;
  console.log("userId: ", userId);
  // 1) Perform the query with .exec() for a real Promise
  const [error, plan] = await to(
    Plan.findOne({ userId })
      .lean<{
        _id: string;
        userId: string;
        name: string;
        description: { key: string; details: string }[];
        unitAmount: number | string;
        interval: string;
        productId: string;
        priceId: string;
      }>()
      .exec()
  );

  console.log("plan: ", plan);

  // 2) Handle errors
  if (error) return next(error);
  if (!plan) {
    return next(createError(StatusCodes.NOT_FOUND, "Plan not found!"));
  }

  // 3) Normalize unitAmount to a number, if it came back as string
  const normalizedPlan = {
    ...plan,
    unitAmount: typeof plan.unitAmount === "string" ? parseFloat(plan.unitAmount) : plan.unitAmount,
  };

  // 4) Send response
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Success",
    data: normalizedPlan,
  });
};


const getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  // 1) Read page & limit from query, with sensible defaults
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
  const skip = (page - 1) * limit;

  try {
    // 2) Get total count
    const [countErr, total] = await to<number>(Plan.countDocuments().exec());
    if (countErr) return next(countErr);

    // 3) Fetch paged plans
    const [findErr, plans] = await to(Plan.find().skip(skip).limit(limit).lean().exec());
    if (findErr) return next(findErr);

    // 4) If no plans at all
    if (!plans || plans.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "No Plans Found!",
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    // 5) Build pagination metadata
    const totalPages = Math.ceil(total / limit);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Success",
      data: plans,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  let { name, description, unitAmount, interval } = req.body;

  let error, price, plan;
  [error, plan] = await to(Plan.findById(id));
  if (error) next(error);
  if (!plan) return next(createError(StatusCodes.NOT_FOUND, "Plan not found!"));

  if (name || description) {
    plan.name = name || plan.name;
    plan.description = description || plan.description;

    const [error] = await to(stripe.products.update(plan.productId, { name: name, description: description }));
    if (error) return next(error);
  }

  if (unitAmount || interval) {
    let [error] = await to(
      stripe.prices.update(plan.priceId, {
        active: false,
      })
    );
    if (error) return next(error);

    plan.unitAmount = Number.parseInt(unitAmount) || plan.unitAmount;
    plan.interval = interval || plan.interval;

    [error, price] = await to(
      stripe.prices.create({
        product: plan.productId,
        unit_amount: plan.unitAmount * 100,
        currency: "usd",
        recurring: {
          interval: plan.interval!,
        },
      })
    );
    if (error) return next(error);
    if (price) plan.priceId = price.id;
  }

  [error] = await to(plan.save());
  if (error) return next(error);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Success",
    data: plan,
  });
};

const planController = {
  create,
  get,
  getAll,
  update,
};

export default planController;
