
(function($){

/**
 * Default options for the pivot table generation.
 *
 */
var defaults = {
	data: [], // resultset from an SQL query (array with objects)
	columns: [],
	rows: [],
	measures: [],
	destroyTable: false,
	funcCache: {},
	tableContainer:'',
	concatString: ' | '
};

/**
 * Constructor. Takes options and thats pretty much it.
 */
var meinPivot = function(options){
	this.options = $.extend(defaults,options);
};

meinPivot.prototype = {
	
	/**
	 * Generates a data recordset based on a table with the
	 * appropriate class hierarchy:
	 * 		.pivot-table-metadata
	 * 			.pivot-table-column
	 * 			...
	 * 			.pivot-table-row
	 * 			...
	 * 			.pivot-table-measure
	 * 			...
	 * 		.pivot-table-data
	 * 			...
	 * 			...
	 * 	The header -> data relation is based on the order
	 * 	where the header fields are found on the DOM.
	 * 	Ex: Column 'Year' is the second child on the metadata DOM
	 * 	so the data for the 'Year' must be the second child in the data DOM.
	 * 	
	 */
	extractDataFromTable : function(table){
		var self = this;
		var newData = [];
		var fields = {};
		table.find('.pivot-table-column,.pivot-table-row,.pivot-table-measure'
				   ,'.pivot-table-metadata')
			.each(function(i,dom){
				var elm = $(dom);
				fields[elm.text()] = elm.index();
				if(elm.hasClass('pivot-table-column'))
					self.options.columns.push(elm.text());
				else if(elm.hasClass('pivot-table-row'))
					self.options.rows.push(elm.text());
				else if(elm.hasClass('pivot-table-measure'))
					self.options.measures.push(elm.text());
			});
		table.find('.pivot-table-data')
			.each(function(i,dom){
				var elm = $(dom);
				var record = {};
				$.each(fields,function(field,idx){
					record[field] = elm.find(':eq('+idx+')').text() || '';
				});
				newData.push(record);
			});
		
		self.options.data = newData;
		
		if(self.options.destroyTable)
			table.remove();
		
		return self;
	},
	
	generate: function(){
		var self = this;
		var pivoted = self.getPivot();
		if(self.options.tableContainer=='')
			return false; // TODO: throw exception
		// TODO: make a HTML table
		return self;
	},
	
	getPivot: function(){
		var self = this;
		var options = self.options;
		
		var tmp,tmpCount,splits;
		var ref,sref;
		tmp = tmpCount = splits = [];
		
		$.each(options.data,function(i,item){
			
			$.each(options.measures,function(m,measure){
				ref = tmp;
				sref = splits;
				
				// assigning row split keys
				$.each(options.rows,function(r,row){
					var rowKey = item[options.rows[r]];
					ref[rowKey] = ref[rowKey] || [];
					ref = ref[rowKey];
				});
				
				// assigning column split keys
				$.each(options.columns,function(c,column){
					var columnKey = item[column];
					ref[columnKey] = ref[columnKey] || [];
					ref = ref[columnKey];
					
					// only column splits assoc. array
					sref[columnKey] = sref[columnKey] || [];
					sref = sref[columnKey];
				});
				
				// assigning values
				ref[measure] = ref[measure] || 0;
				
				ref[measure] += item[measure];
				sref[measure] = measure;
			});
		});
		
		return self.buildPivot(tmp,splits);
	},
	
	/**
	 * Take the processed data and build a new array of objects,
	 * proper for a HTML table.
	 *
	 */
	buildPivot: function(tmp,splits){
		var self = this;
		var options = self.options;
		var columns = options.columns;
		var rows = options.rows;
		var measures = options.measures;
		var ckey = columns.length+':'+rows.length+':'+measures.length;
		var out = [];
		var func;
		
		// TODO: check the function cache
		if(options.funcCache[ckey])
			return options.funcCache[ckey]
					.exec(out,columns,rows,measures,tmp,splits);
		
		var code = 'func = {exec:function(out,columns,rows,measures,tmp,splits){';
		
		code += 'return splits;';
		
		code += '}};';
		
		eval(code);
		
		// cache it
		options.funcCache[ckey] = func;
		
		return func.exec(out,columns,rows,measures,tmp,splits);
	},
	
	/**
	 * Concatenate field names using a predefined string.
	 */
	concatFields: function(){
		var self = this;
		return $(arguments).toArray()
				.join(self.options.concatString);
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