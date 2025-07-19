import Stripe from "stripe";
import "dotenv/config";
import to from "await-to-ts";
import createError from "http-errors";
import { NextFunction, Request, Response } from "express";
import SubscriptionPlan from "@models/subscriptionPlanModel";
import { StatusCodes } from "http-status-codes";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, description, unitAmount, interval } = req.body;
  let error, product, price, subscriptionPlan;

  const formattedDescription = description
    .map((desc: { key: string; details: string }) => `${desc.key}: ${desc.details}`)
    .join(" | ");

  [error, product] = await to(
    stripe.products.create({
      name: name!,
      description: formattedDescription
    })
  );
  if (error) return next(error);

  [error, price] = await to(
    stripe.prices.create({
      product: product.id,
      unit_amount: Number.parseFloat(unitAmount) * 100,
      currency: "usd",
      recurring: {
        interval: interval!
      }
    })
  );
  if (error) return next(error);

  [error, subscriptionPlan] = await to(
    SubscriptionPlan.create({
      name: name,
      description: description,
      unitAmount: Number.parseFloat(unitAmount),
      interval: interval,
      productId: product.id,
      priceId: price.id
    })
  );
  if (error) return next(error);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Success",
    data: subscriptionPlan
  });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const Id = req.params.id;
  // 1) Perform the query with .exec() for a real Promise
  const [error, plan] = await to(
    SubscriptionPlan.findById(Id)
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
    const [countErr, total] = await to<number>(SubscriptionPlan.countDocuments().exec());
    if (countErr) return next(countErr);

    // 3) Fetch paged plans
    const [findErr, plans] = await to(SubscriptionPlan.find().skip(skip).limit(limit).lean().exec());
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
  let error, price, subscriptionPlan;
  [error, subscriptionPlan] = await to(SubscriptionPlan.findById(id));
  if (error) return next(error);
  if (!subscriptionPlan) return next(createError(StatusCodes.NOT_FOUND, "Subscription Plan not found!"));

  if (name || description) {
    subscriptionPlan.name = name || subscriptionPlan.name;
    subscriptionPlan.description = description || subscriptionPlan.description;

    const [error] = await to(stripe.products.update(subscriptionPlan.productId, {
      name: name,
      description: description
    }));
    if (error) return next(error);
  }

  if (unitAmount || interval) {
    let [error] = await to(
      stripe.prices.update(subscriptionPlan.priceId, {
        active: false
      })
    );
    if (error) return next(error);

    subscriptionPlan.unitAmount = unitAmount || subscriptionPlan.unitAmount;
    subscriptionPlan.interval = interval || subscriptionPlan.interval;

    [error, price] = await to(
      stripe.prices.create({
        product: subscriptionPlan.productId,
        unit_amount: Number.parseFloat(subscriptionPlan.unitAmount) * 100,
        currency: "usd",
        recurring: {
          interval: subscriptionPlan.interval!
        }
      })
    );
    if (error) return next(error);
    if (price) subscriptionPlan.priceId = price.id;
  }

  [error] = await to(subscriptionPlan.save());
  if (error) return next(error);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Success",
    data: subscriptionPlan
  });
};

const SubscriptionPlanController = {
  create,
  get,
  getAll,
  update
};

export default SubscriptionPlanController;
