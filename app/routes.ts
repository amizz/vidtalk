import { type RouteConfig, index, layout, route, prefix } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/videos", "routes/api.videos.tsx"),
  ...prefix("videos", [
    layout("routes/videos.tsx", [
      index("routes/videos._index.tsx"),
      route("collection-chat", "routes/videos.collection-chat.tsx"),
      route(":id", "routes/videos.$id.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
