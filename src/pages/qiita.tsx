import React from "react";
import { IReduxState, ReduxAction } from "../store";
import { qiitaActions } from "../modules/Qiita";
import { Dispatch } from "redux";
import QiitaContainer from "../containers/Qiita";
import { NextContext } from "next";
import { compose, setStatic, pure } from "recompose";
import Layout from "../components/Layout";
import { isLoggedIn } from "../domain/Auth";
import { rootActions } from "../modules/Root";

interface IProps {
  actions: Dispatch<ReduxAction>;
  value: IReduxState;
}

const QiitaPage: React.FunctionComponent<IProps> = (props: IProps) => {
  return (
    <Layout value={props.value}>
      <QiitaContainer value={props.value} actions={props.actions} />
    </Layout>
  );
};

const enhance = compose(
  setStatic("getInitialProps", async (ctx: NextContext) => {
    const { err, isServer } = ctx;
    if (err != null) {
      // TODO 何らかのError処理を行う
    }

    const pageProps = {
      title: "🐱Qiita ユーザー検索🐱",
      isLoggedIn: isLoggedIn(ctx),
      value: ctx.store.getState()
    };

    ctx.store.dispatch(rootActions.pageTransition(pageProps));

    const containerProps = {
      actions: ctx.store.dispatch,
      value: ctx.store.getState()
    };

    if (!isServer) {
      return Object.assign(pageProps, containerProps);
    }

    const request = {
      id: "keitakn"
    };

    ctx.store.dispatch(qiitaActions.postFetchUserRequest(request));

    return Object.assign(pageProps, containerProps);
  }),
  pure
);

export default enhance(QiitaPage);
