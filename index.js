/**
 * Module dependencies.
 * @private
 */
// private npm modules
var express       = require('express');
var bodyParser    = require('body-parser');
var cookieParser  = require('cookie-parser');
var io_cookie     = require('socket.io-cookie-parser');
var fs            = require('fs');
var nodedump      = require('nodedump');
var multer        = require('multer');

// exported npm modules
var path          = require('path');
var mv            = require('mv');

// local modules 
var pg            = require('./lib/pg');
var debug         = require('./lib/debug');
var send          = require('./lib/send');
// on crée l'app express
var app           = express();
var http          = require('http').Server(app);
var io            = require('socket.io')(http);

/**
 * Module exports.
 * @public
 */

module.exports.up      = false;
module.exports.mv      = mv;
module.exports.path    = path;
module.exports.dump    = nodedump.dump;
module.exports.io      = io;
module.exports.upload  = multer({ dest: '/tmp/node_uploads', limits:{fileSize: 1000000} }).any();
module.exports.router  = express.Router;
// méthode d'initialisation du web server
// -> placement des routes prédéfinies
module.exports.server  = function(cfg) {
  // valeurs par défaut
  if (cfg.appdir  === undefined) cfg.appdir  = '.';
  if (cfg.verbose === undefined) cfg.verbose = true;
  if (cfg.port    === undefined) cfg.port    = 8080;
  // on ne place les routes sur l'app express que lors du premier appel
  // les fois suivantes (s'il y en a ...) on renvoie juste l'app
  if (cfg !== undefined && !this.up) {
    // redéfinition du header express
    // Enise power !
    app.use(function(req,res,next){
      res.setHeader('X-Powered-By', 'Enise');
      next();
    });
    // parsing des arguments POST
    // pour peupler req.body
    app.use(bodyParser.urlencoded({ extended: true }));
    // parsing des COOKIES
    // pour peupler req.cookies
    app.use(cookieParser());
    io.use(io_cookie());
    // messages console
    if (cfg.verbose) app.use(debug);
    // utilisation du routeur principal de l'application
    // i.e. 'monapp/routes/index.js'
    var routes_path = path.join(__dirname,'../..',cfg.appdir,'routes');
    var ok;
    try {
      ok = fs.statSync(routes_path).isDirectory();
    }
    // warning si l'application n'a pas de dossier 'routes'
    catch (e) {
      ok = false;
      console.log("Warning : you're application doesn't seem to have a 'routes' directory.");
    }
    try {
      // if faudrait tester ici si le fichier 'index.js' est absent
      // pour envoyer un warning dans la console
      if (ok) app.use(require(routes_path));
    }
    catch (e) {
      console.log(e);
    }
    // définition du serveur statique
    // il sert le répertoire 'monapp/public'
    var public_path = path.join(__dirname, '../..', cfg.appdir,'public');
    try {
      ok = fs.statSync(public_path).isDirectory();
    }
    // warning si l'application n'a pas de dossier 'public'
    catch (e) {
      ok = false;
      console.log("Warning : you're application doesn't seem have a 'public' directory.");
    }
    try {
      if (ok) app.use(express.static(public_path));
    }
    catch (e) {
      console.log(e);
    }
    // traitement des requetes POST de type '/files/*' pour servir
    // les fichiers du dossier 'monapp/files'
    app.post('/files/:name', send(cfg.appdir, cfg.verbose));
    // on peut maintenant accepter les connexions sur le port choisi
    http.listen(cfg.port, function(){
      this.up = true;
      console.log('Server is up on port',cfg.port);
    });
  }
  return app;
};	
// méthode d'initialisation du driver postgresql
// -> memorisation de la chaine de connexion
module.exports.pg = function(cfg) {
  if (cfg !== undefined) {
    pg.connectionString = 'postgres://'+cfg.user+':'+cfg.password
			+'@'+cfg.host+':5432/'+cfg.database;
	}
  return pg;
};
