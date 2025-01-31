/*---
description:
flags: [module]
---*/

import URL from "url";

const url = new URL("http://moddable.com/?x=0&y=1");
const searchParams = url.searchParams;

assert.sameValue(searchParams.get("x"), "0");
assert.sameValue(searchParams.get("y"), "1");

searchParams.set("x", 2);
searchParams.set("y", 3);

assert.sameValue(url.search, "?x=2&y=3");

