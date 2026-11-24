import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/lib/config";
import type { Game, GameFilterParams, PaginatedGamesResponse } from "@/types";

function buildGameQueryString(params?: GameFilterParams | void): string {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.genre) queryParams.set("genre", params.genre);
  if (params?.platform) queryParams.set("platform", params.platform);
  if (params?.sort_by) queryParams.set("sort_by", params.sort_by);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.page_size) queryParams.set("page_size", String(params.page_size));
  return queryParams.toString();
}

export const gamesApi = createApi({
  reducerPath: "gamesApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ["Game"],
  endpoints: (builder) => ({
    getGames: builder.query<Game[], GameFilterParams | void>({
      query: (params) => {
        const qs = buildGameQueryString(params);
        return qs ? `/games?${qs}` : "/games";
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Game" as const, id })),
              { type: "Game", id: "LIST" },
            ]
          : [{ type: "Game", id: "LIST" }],
    }),
    getPaginatedGames: builder.query<PaginatedGamesResponse, GameFilterParams | void>({
      query: (params) => {
        const qs = buildGameQueryString(params);
        return qs ? `/games/paginated?${qs}` : "/games/paginated";
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Game" as const, id })),
              { type: "Game", id: "PAGINATED_LIST" },
            ]
          : [{ type: "Game", id: "PAGINATED_LIST" }],
    }),
    getRandomGame: builder.query<Game, { genre?: string; platform?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.genre) queryParams.set("genre", params.genre);
        if (params?.platform) queryParams.set("platform", params.platform);
        const qs = queryParams.toString();
        return qs ? `/games/random?${qs}` : "/games/random";
      },
    }),
    getGame: builder.query<Game, string>({
      query: (id) => `/games/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Game", id }],
    }),
  }),
});

export const {
  useGetGamesQuery,
  useGetPaginatedGamesQuery,
  useLazyGetRandomGameQuery,
  useGetGameQuery,
} = gamesApi;
