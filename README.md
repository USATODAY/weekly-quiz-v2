#weekly-quiz

Weekly News Quiz


Copyright 2015 USA TODAY. All rights reserved. No part of these materials may be reproduced, modified, stored in a retrieval system, or retransmitted, in any form or by any means, electronic, mechanical or otherwise, without prior written permission from USA TODAY.

##Development

The requirements for this project are Node.js, Bower and Grunt. 

To install node with Hombrew:
`brew install node`

Or head over to the [Node website](http://nodejs.org/) and install from there.
Once Node is installed, install Grunt with
`npm install -g grunt-cli`

and install Bower with 
`npm install -g bower`

Once those dependencies are set up, from this repository run `npm install`, then run `bower install`, then run `grunt`

##Javascript tests

Tests are stored in the spec folder, and written using the [Jasmine](http://jasmine.github.io/) spec. To run tests, run `grunt test`. 

##Deployment

The deployment tools in this project assume your are deploying to USA TODAY's CDN and publishing to usatoday.com, and that you have USA TODAY's credentials stored locally on your computer. Otherwise this deployment method won't work without being re-configured.

If you do meet those conditions:

When you're ready to deploy, run `grunt deploy`. 

##Assetts

USA TODAY Images, videos, and other assetts are stored outside this repository on our CDN and referenced via absolute URL's.