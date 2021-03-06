import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import next from "next";
import {
  requestToQiitaUserApi,
  requestToAuthenticatedQiitaUserApi
} from "./api/QiitaApi";
import { AxiosError } from "axios";
import {
  createAuthorizationState,
  createAuthorizationUrl,
  issueAccessToken
} from "./auth";
import { appUrl } from "../constants/appEnv";

const app = (next: next.Server): express.Express => {
  const app = express();
  const handle = next.getRequestHandler();
  app.enable("strict routing");
  app.use(
    cors({
      origin: [appUrl()],
      methods: ["GET", "POST", "OPTIONS"]
    })
  );
  app.use(compression());
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());

  // /api/v2/authenticated_user へのアクセス
  // アクセストークンに紐付いたQiitaユーザー情報を返す
  app.post(
    "/api/qiita/authenticated_users",
    async (req: express.Request, res: express.Response): Promise<any> => {
      const accessToken = req.body.accessToken;
      if (accessToken == null) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await requestToAuthenticatedQiitaUserApi({ accessToken })
        .then(authenticatedQiitaUserResponse => {
          return res.status(200).json(authenticatedQiitaUserResponse);
        })
        .catch((error: AxiosError) => {
          if (error.response === undefined) {
            return res.status(500).json({ message: "Internal Server Error" });
          }

          return res.status(error.response.status).json(error.response.data);
        });
    }
  );

  // Qiita User APIへのアクセス
  app.get(
    "/api/qiita/users/:id",
    async (req: express.Request, res: express.Response) => {
      const params = req.params;
      await requestToQiitaUserApi(params)
        .then(qiitaUserResponse => {
          return res.status(200).json(qiitaUserResponse);
        })
        .catch((error: AxiosError) => {
          if (error.response === undefined) {
            return res.status(500).json({ message: "Internal Server Error" });
          }

          return res.status(error.response.status).json(error.response.data);
        });
    }
  );

  // Qiitaの認可サーバーへリクエスト
  app.get("/oauth/request", (req: express.Request, res: express.Response) => {
    const authorizationState = createAuthorizationState();
    res.cookie("authorizationState", authorizationState, {
      path: "/",
      httpOnly: true
    });

    return res.redirect(302, createAuthorizationUrl(authorizationState));
  });

  // Qiitaの認可サーバーからのコールバック
  app.get(
    "/oauth/callback",
    async (req: express.Request, res: express.Response) => {
      if (req.cookies.authorizationState == null) {
        // TODO 何らかのエラー処理を行う
      }

      if (req.cookies.authorizationState !== req.query.state) {
        // TODO stateが一致しない場合は何らかのエラー処理を行う
      }

      if (req.query.code == null) {
        // TODO 認可コードが含まれない場合は何らかのエラー処理を行う
      }

      await issueAccessToken(req.query.code)
        .then(tokenResponse => {
          res.cookie("accessToken", tokenResponse.token, {
            path: "/"
          });

          return res.status(302).redirect(`${appUrl()}/my`);
        })
        .catch(error => {
          return res
            .status(error.response.status)
            .json({ message: error.response.data.message });
        });
    }
  );

  // SPA のデフォルトルーティング
  app.get("*", (req: express.Request, res: express.Response) => {
    return handle(req, res);
  });

  return app;
};

export default app;
