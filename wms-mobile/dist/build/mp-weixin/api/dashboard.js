"use strict";const t=require("./request.js"),s={getStats:()=>t.http.get("/dashboard/stats",void 0,{showLoading:!1})};exports.dashboardApi=s;
