import "reflect-metadata";
import { crudResolvers } from "@generated/type-graphql";
import { PrismaClient } from "@prisma/client";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer } from "apollo-server-express";
import connectRedis from "connect-redis";
import cors from "cors";
import Express from "express";
import session from "express-session";
import Redis from "ioredis";
import { buildSchema } from "type-graphql";
import { AuthResolver } from "./resolvers/AuthResolver";

const RedisStore = connectRedis(session);
const redis = new Redis();
const prisma = new PrismaClient();

const bootstrap = async () => {
  const schema = await buildSchema({
    resolvers: [...crudResolvers, AuthResolver],
  });

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }) => ({ req, prisma }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  const app = Express();
  app.use(cors({ origin: "http://localhost:4000", credentials: true }));
  app.use(
    session({
      store: new RedisStore({
        client: redis,
      }),
      name: "qid",
      secret: "secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 69,
        secure: false,
      },
    })
  );

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("server started on http://localhost:4000/graphql");
  });
};

bootstrap();
