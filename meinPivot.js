(function($){
	
	jQuery.fn.meinPivot = function(options) {	
		this.config = jQuery.extend({
			
		}, options);
		
		this.init();
	};

	jQuery.fn.meinPivot.prototype = {
		init: function(){
			console.log(this.config);
		}
	};

})(jQuery);