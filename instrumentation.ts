import type { Instrumentation } from "next";
import { reportException } from "@/lib/observability/provider";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  _request,
  context,
) => {
  await reportException(error, {
    event: "server_exception",
    route: context.routePath,
  });
};
