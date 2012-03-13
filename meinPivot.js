/**
 * MeinPivot - generate Pivot tables with unlimited number of Pivoting fields.
 * Javascript/jQuery version.
 * 
 * This class was inspired by the great gam-pivot php class made by
 * Gonzalo Ayuso (gonzalo123), that can be found in GitHub:
 * 
 * https://github.com/gonzalo123/gam-pivot
 * 
 * The main purpose of making a new class was to make possible the pivoting of 
 * columns to unlimited rows.
 * 
 * Website: https://github.com/djjorjinho/meinPivot
 * License: BSD 2-Clause License
 */
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
	this.options = $.extend({},defaults,options);
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
	
	table: function(){
		var self = this;
		var pivoted = self.getPivot();
		if(self.options.tableContainer=='')
			return pivoted; 

		return self.simpleHtmlTable(pivoted);
	},
	
	simpleHtmlTable : function(data){
		var self = this;
		var rows = self.options.rows;
		out="";
		out+="<table class='pivot-table-result'>";
		    out+= "<thead>";
		    for (var item1 in data[0]) {
		        out+= "<td class='pivot-table-result-column'>"+item1+"</td>";
		    }
		    out+= "</thead>";
		    for (var row in data) {
		    	var cnt = rows.length;
		        out+= "<tr>";
		        for (var item2 in data[row]) {
		        	var cls = cnt > 0
								? 'pivot-table-result-row'
								: 'pivot-table-result-value';
		        	var val = data[row][item2]
		        	val= (val==undefined) ? '': val;
		            out+= "<td class='"+cls+"'>"+val+"</td>";
		            cnt--;
		        }
		        out+= "</tr>";
		    }
		    out+= "</table>";
		    jQuery(self.options.tableContainer).html(out);
		return self;
	},
	
	getPivot: function(){
		var self = this;
		var options = self.options;
		
		var tmp ={};
		var splits = {};
		var ref,sref;
		
		$.each(options.data,function(i,item){
			
			$.each(options.measures,function(m,measure){
				ref = tmp;
				sref = splits;
				
				// assigning row split keys
				$.each(options.rows,function(r,row){
					var rowKey = item[options.rows[r]];
					ref[rowKey] = ref[rowKey] || {};
					ref = ref[rowKey];
				});
				
				// assigning column split keys
				$.each(options.columns,function(c,column){
					var columnKey = item[column];
					ref[columnKey] = ref[columnKey] || {};
					ref = ref[columnKey];
					
					// only column splits assoc. array
					sref[columnKey] = sref[columnKey] || {};
					sref = sref[columnKey];
				});
				
				// assigning values
				ref[measure] = ref[measure] || 0;
				
				var mvalue = parseFloat(item[measure]);
				ref[measure] += isNaN(mvalue) ? 0 : mvalue;
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
		var concat = options.concatString;
		var ckey = columns.length+':'+rows.length+':'+measures.length;
		var out = [];
		var func;
		
		if(options.funcCache[ckey])
			return options.funcCache[ckey]
					.exec(out,columns,rows,measures,tmp,splits);
		
		var code = 'func = {exec:function(out,columns,rows,measures,tmp,splits){';
		
		// open rows
		$.each(rows,function(r,row){
			if(r==0)
				code += "$.each(tmp,function(p"+r+",p"+r+"Values){";
			else
				code += "$.each(p"+(r-1)+"Values,function(p"+r+",p"+r+"Values){";
		});
		
		// variables
		code += "var _out = {};";
		$.each(rows,function(r,row){
			code += "_out[rows["+r+"]] = p"+r+";";
		});
		
		var _aux = [];
		// open columns
		$.each(columns,function(c,column){
			if(c==0){
				code += "$.each(splits,function(s0){";
				code += "var spl0 = splits[s0];";
				code += "var colValues = p"+(rows.length-1)+"Values;";
			}else{
				var i = c-1;
				code += "$.each(spl"+i+",function(s"+c+"){";
				code += "var spl"+c+" = spl"+i+"[s"+c+"];";
			}
			_aux.push('s'+c);
		});
		
		var arraux = '['+_aux.join('][')+']';
		
		// open measures
		code += "$.each(measures,function(m,measure){";
		code += "var value;";
		code += "try{ value = colValues"+arraux+"[measure] || '';}";
		code += "catch(err){value='';};";
		code += "_out["+_aux.join("+'"+concat+"'+")+"+'"+concat+"'+measure] = value;";
		
		// close measures
		code += "});";
		
		// close columns
		$.each(columns,function(c,column){
			code += "});";
		});
		
		code += "out.push(_out);";
		
		// close rows
		$.each(rows,function(r,row){
			code += "});";
		});
		
		code += "return out;";
		code += '}};';
		
		eval(code);
		
		// cache it
		options.funcCache[ckey] = func;
		
		return func.exec(out,columns,rows,measures,tmp,splits);
	}
};

/**
 * JQuery pivot table factory.
 * Set the data yourself in the options.
 *
 */
$.meinPivot = function(options){
	return new meinPivot(options);
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