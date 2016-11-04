module.exports = function (req, res, next) {
  // middleware de retour console
  // sur les requetes GET et POST
  console.log('Http ', req.method, ' request on ', req.originalUrl);
  switch (req.method) {
  case 'GET':
    //console.log('GET variables : ', req.query);
    break;
  case 'POST':
    console.log('POST variables : ', req.body);
    break;
  }
  console.log('Cookies :', req.cookies);
  next();
};
