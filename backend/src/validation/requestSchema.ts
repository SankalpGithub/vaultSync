import { z } from "zod";

const empty = z.strictObject({});

type RequestSchema = typeof empty;

export const createRequestSchema = ({
  body = empty,
  query = empty,
  params = empty,
  cookies = empty,
  headers = z.looseObject({}),
}: {
  body?: RequestSchema;
  query?: RequestSchema;
  params?: RequestSchema;
  cookies?: RequestSchema;
  headers?: RequestSchema;
}) => {
  return z.object({
    body,
    query,
    params,
    cookies,
    headers,
  });
};
