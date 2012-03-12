(function($){
	
var meinPivot = function(data,options){
	console.log(data);
};

meinPivot.prototype = {
	
};

$.meinPivot = function(data, options){
	return new meinPivot(data,options);
};

}(jQuery));