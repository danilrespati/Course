# Random Quote Generator

This Random Quote Generator read [motivational quotes][1] from csv file then showing one random quote to the page.

## Version

### 2.1.0 
+ Change background color
+ Text styling
+ Text animation

### 2.0.0 
+ Basic page display

### 1.1.0 
+ Only showing it to console
+ Fix bug

### 1.0.0 
+ Only showing it to console
+ If an author have multiple quotes, the *second* to *n-th* quote will **not** have the author's name

## Additional Info

### brfs

`const fs = require('fs')` made possible by using command:
```
$ browserify -t brfs script.js > bundle.js
```

after installing:
```
$ npm install -g browserify
$ npm install brfs
```

## Sources 

[Motivational quotes][1]

[browserify][2]

[brfs][3]

[1]: https://gist.github.com/JakubPetriska/060958fd744ca34f099e947cd080b540
[2]: http://browserify.org/
[3]: https://github.com/browserify/brfs