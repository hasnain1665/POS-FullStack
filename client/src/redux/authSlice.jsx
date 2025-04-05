import { createSlice } from "@reduxjs/toolkit";
const storedToken = localStorage.getItem("token");
const storedUser = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

const authSlice = createSlice({
  name: "auth",
  initialState: { user: storedUser, token: storedToken },
  reducers: {
    loginUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const { loginUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;
