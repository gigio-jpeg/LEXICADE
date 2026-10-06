import { path } from "./config.js";
export const navigate = (route) => {
  location.href = path(route);
};
export const query = (name) => new URL(location.href).searchParams.get(name);
