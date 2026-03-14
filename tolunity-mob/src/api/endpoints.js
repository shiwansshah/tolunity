export const ENDPOINTS = {

  LOGIN: "/auth/login",
  REGISTER: "/auth/register",

  FEED: "/feed",

  CREATE_POST: "/post",
  EDIT_POST: id => `/post/${id}`,
  DELETE_POST: id => `/post/${id}`,

  LIKE: id => `/post/${id}/like`,

  COMMENT: id => `/post/${id}/comment`

}