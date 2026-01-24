import { createSlice } from "@reduxjs/toolkit";

const leadSlice = createSlice({
  name: "lead",
  initialState: {
    list: [], // ✅ ALWAYS ARRAY
  },
  reducers: {
    setLeads: (state, action) => {
      state.list = Array.isArray(action.payload)
        ? action.payload
        : [];
    },
    resetLeads: (state) => {
      state.list = [];
    },
  },
});

export const { setLeads, resetLeads } = leadSlice.actions;
export default leadSlice.reducer;
