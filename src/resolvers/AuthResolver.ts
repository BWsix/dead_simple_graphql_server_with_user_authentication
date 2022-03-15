import { User } from "@generated/type-graphql";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Request } from "express";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

const prisma = new PrismaClient();

interface Context {
  req: Request;
}

@Resolver()
export class AuthResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: Context) {
    return (ctx.req.session as any).user;
  }

  @Mutation(() => User)
  async register(
    @Arg("name") name: string,
    @Arg("password") password: string,
    @Ctx() ctx: Context
  ) {
    const userWithSameName = await prisma.user.count({ where: { name } });
    if (userWithSameName !== 0) throw new Error("name taken");

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, password: hashedPassword },
    });

    return ((ctx.req.session as any).user = user);
  }

  @Mutation(() => User)
  async login(
    @Arg("name") name: string,
    @Arg("password") password: string,
    @Ctx() ctx: Context
  ) {
    const user = await prisma.user.findFirst({ where: { name } });
    if (!user) throw new Error("user not found");

    const is_valid = await bcrypt.compare(password, user.password);
    if (!is_valid) throw new Error("incorrect password");

    return ((ctx.req.session as any).user = user);
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req: { session } }: Context) {
    const user = (session as any).user;
    if (!user) return false;

    (session as any).user = null;
    return true;
  }
}
