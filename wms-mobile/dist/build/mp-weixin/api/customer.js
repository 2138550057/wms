"use strict";const e=require("./request.js"),s={getList:()=>e.http.get("/customers",{page:1,size:999},{showLoading:!1})};exports.customerApi=s;
