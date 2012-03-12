
(function($){

/**
 * Default options for the pivot table generation.
 *
 */
var defaults = {
	data: [],
	columns: [],
	rows: [],
	measures: [],
	destroyTable: false,
	funcCache: {}
};

/**
 * Constructor. Takes options and thats pretty much it.
 */
var meinPivot = function(options){
	this.options = $.extend(defaults,options);
	console.log(this.options);
};

meinPivot.prototype = {
	extractDataFromTable : function(table){
		var self = this;
		table.find('.pivot-table-column,.pivot-table-row,.pivot-table-measure')
			.each(function(i,dom){
				console.log(dom);
				console.log($(dom).index());
			});
	}
};

/**
 * JQuery pivot table factory.
 * Set the data yourself in the options.
 *
 */
$.meinPivot = function(options){
	var mp = new meinPivot(options);
};

/**
 * JQuery style pivot table factory.
 * Select a table element and specify the options.
 * The data, columns, rows and measures will be extracted from the html table.
 */
$.fn.meinPivot = function(options){
	var mp = new meinPivot(options);
	// one table element at a time boys...
	mp.extractDataFromTable($(this.get(0)));
	return mp;
};

}(jQuery));