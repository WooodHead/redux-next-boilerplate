import React from "react";
import { ICounterState } from "../modules/Counter";
import CounterContainer from "../containers/Counter";
import { Dispatch } from "redux";
import { ReduxAction } from "../store";
import { compose, pure, setStatic } from "recompose";
import { NextContext } from "next";

interface IProps {
  actions: Dispatch<ReduxAction>;
  value: ICounterState;
}

export const CounterPage: React.SFC<IProps> = (props: IProps) => {
  return (
    <>
      <CounterContainer actions={props.actions} value={props.value} />
    </>
  );
};

const enhancer = compose(
  setStatic("getInitialProps", async (ctx: NextContext) => {
    const { err } = ctx;
    if (err != null) {
      // TODO 何らかのError処理を行う
    }

    return {
      title: "🐱カウンター🐱"
    };
  }),
  pure
);

export default enhancer(CounterPage);
