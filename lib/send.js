var path         = require('path');
var fs           = require('fs');

module.exports = function(appdir, verbose) {
	// retourne un middleware destiné à servir les fichiers du dossier 'monapp/files'
	// le nom du fichier à servir est extrait de la route demandée
	// route: '/files/:name' -> le parsing peuple req.params.name	
  return function (req, res, next) {
		var filesDir = path.join(__dirname, '../../..', appdir,'files');
		var fileName = req.params.name;
		var fullName = path.join(filesDir, fileName);
		try {
			if (fs.statSync(filesDir).isDirectory()) {
				res.sendFile(fullName, function (err) {
					if (err) {
						console.log("Could not send file", "'"+fileName+"'");
						res.status(err.status).end();
					}
					else {
						if (verbose) console.log('Sent:', fileName);
					}
				});
			}
		}
		// warning si l'application n'a pas de dossier 'files'
		// et erreur 404 à destination du client
		catch (err) {
			console.log("Warning : you're application doesn't have a 'files' directory.");
			console.log("Could not send file", "'" + fileName + "'");
			res.status(404).end();
		}
  };
};

