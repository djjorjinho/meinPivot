<?php
/**
 * MeinPivot - generate Pivot tables with unlimited number of Pivoting fields.
 * 
 * This class was inspired by the great gam-pivot php class made by
 * Gonzalo Ayuso (gonzalo123), that can be found in GitHub:
 * 
 * https://github.com/gonzalo123/gam-pivot
 * 
 * The main purpose of making a new class was to make possible the pivoting of 
 * columns to unlimited rows and provide caching of output results 
 * using your favourite caching mechanism (i.e. Memcached, filesystem, etc.)
 * 
 * Website: https://github.com/djjorjinho/meinPivot
 * License: BSD 2-Clause License
 */
class MeinPivot{
	
	// columns to be turned into rows (Pivotation)
    private $_pivotOn = null;
	
	// Columns fields
	private $_column = null;
	
	// Metrics / Measures fields
    private $_measures = null;
	
	// combinations of 
	private $_splits = array();
	
	// the final pivoted resultset
	private $_data=null;
	
	// function cache for the dynamically generated code
	private static $func_cache=array();
	
	/**
	 * MeinPivot instance constructor
	 * 
	 * @param array An array of associative arrays, resembling a MySQL recordset
	 */
    public function __construct($recorset,$columns,$rows,$measures)
    {
        $this->_recordset = $recorset;
		$this->_column = $columns;
    	$this->_measures = $measures;
    	$this->_pivotOn = $rows;
    }
    
	/**
	 * Generates a new Pivot table resultset.
	 * Starts by summing values for Rows / Column fields, 
	 * then generates the final output resultset.
	 * 
	 * Combinations of Rows / Columns are concatenated by space/pipe characters.
	 * 
	 * @return array The final array with the aggregated columns/rows/measures 
	 */
    public function get()
	{

    	$columns =& $this->_column;
    	$measures =& $this->_measures;
    	$rows =& $this->_pivotOn;
    	
    	$tmp = $splits = $tmpCount = array();
    	$clen = count($columns)-1; // columns length
    	$rlen = count($rows)-1; // rows length
    	$mlen = count($measures)-1; // measures length
    	 
    	foreach ($this->_recordset as $reg) {
    
    		foreach ($measures as $item) {
    			$ref =& $tmp;
    			$sref =& $splits;
				
    			// assigning row split keys
    			foreach(range(0,$rlen) as $idx)
				{
    				$k = $this->get_column_item($reg,$idx);
    				if(!isset($ref[$k]))
						$ref[$k] = array();
    
    				$ref =& $ref[$k];
    			}
    	   
    			// assingning column split keys
    			foreach(range(0,$clen) as $idx)
				{
    				$f = $columns[$idx];
    				$k = $reg[$f];
    
    				if(!isset($ref[$k]))
    				$ref[$k] = array();
    				$ref =& $ref[$k];
    
    				// only column splits assoc. array
    				if(!isset($sref[$reg[$f]]))
						$sref[$reg[$f]] = array();
					
    				$sref =& $sref[$reg[$f]];
    			}
    	   
    			// assigning values
				if(! isset($ref[$item]))
					$ref[$item] = 0;
				
    			$ref[$item] += $reg[$item];
    			$sref[$item] = $item;
    		}
    	}
    	
		// setting splits array
    	$this->_splits = $splits;
		
		//print "splits: "; print_r($splits);
		//print "tmp: "; print_r($tmp);
		
		// generate new resultset with pivoted rows/values
    	$this->_data = $this->build_output($tmp,$columns,$rows,$measures
																	,$splits);
		
    	return $this->_data;
    }
    
	/**
	 * Takes the intermediate values and generates 
	 * a new resultset-like pivot table.
	 * 
	 * This function generates dynamic code from a concatenated string.
	 * Right now it's the best solution my poor brain can muster.
	 * Hopefully we can create a better solution with some help.
	 * 
	 * @param array Structure that holds the aggreagated values 
	 *					for every Row by Columns by Metric combination
	 * @param array Columns fields
	 * @param array Rows fields
	 * @param array Measures fields
	 * @param array Structure by which the Columns present every measure
	 * @return array The final array with the aggregated columns/rows/measures 
	 */
    private function build_output(&$tmp,&$columns,&$rows,&$measures,&$splits)
	{
		$out=array();
		
		// visit function memory cache
		$ckey = count($columns).':'.count($rows).':'.count($measures);
		if(isset(self::$func_cache[$ckey]))
		{
			$newfunc = self::$func_cache[$ckey];
			return $newfunc($tmp,$out,$columns,$rows,$measures,$splits);
		}
		
    	
    	$clen = count($columns)-1;
    	$rlen = count($rows)-1;
    	$mlen = count($measures)-1;
    	
		// generate dynamic code according to row count,
		// metric count and column count
    	$code ="";$tab="\t";
		
    	// begin row pivots
    	foreach(range(0,$rlen) as $idx)
		{
    		if($idx==0)
			{
    			$code .= 'foreach ($tmp as $p0 => $p0Values) {'."\n";
    		}
			else
			{
    			$i = $idx-1;
    			$code .= $tab.'foreach ($p'.$i.'Values '
									.'as $p'.$idx.' => $p'.$idx.'Values){'."\n";
    		}
    	}
		
    	// iteration array
    	$code.= $tab.$tab.'$_out=array();'."\n";
    	foreach(range(0,$rlen) as $idx)
		{
    		$code.= $tab.$tab.'$_out[$rows['.$idx.']] = $p'.$idx.';'."\n";
    	}
    	
    	// column elements concatenation
    	$_aux=array();
    	foreach(range(0,$clen) as $idx)
		{
    		if($idx==0)
			{
    			$code.= $tab.$tab.'foreach (array_keys($splits) as $s'.$idx.') {'."\n";

    			$code.= $tab.$tab.$tab.'$spl'.$idx.'=$splits[$s'.$idx.'];'."\n";
    			$code.= $tab.$tab.$tab.'$colValues = $p'.$rlen.'Values;'."\n";
    			array_push($_aux, '$s'.$idx);
    		}
			else
			{
    			$i=$idx-1;
    			$code.= $tab.$tab.$tab.'foreach(array_keys($spl'.$i.') as $s'.$idx.'){'."\n";
    			$code.= $tab.$tab.$tab.$tab.'$spl'.$idx.'=$spl'.$i.'[$s'.$idx.'];'."\n";
    			
    			array_push($_aux, '$s'.$idx);
    		}
    	}
    	
    	// measure concat
    	$code.= $tab.$tab.$tab.$tab.'foreach ($measures as $k) {'."\n";
    	$_arraux="";
    	if(!empty($_aux)) $_arraux = "[".implode("][",$_aux)."]";
    	$code.= $tab.$tab.$tab.$tab.$tab
					.'$value = (! isset($colValues'.$_arraux.'[$k])) '
						.'? null : $colValues'.$_arraux.'[$k];'."\n";
    	$code.= $tab.$tab.$tab.$tab.$tab
					.'$_out['.implode(".' | '.",$_aux).".' | '.".'$k] = $value;'."\n";
					
    	$code.= $tab.$tab.$tab.$tab.'}'."\n";
    	
    	// close column elements
    	foreach(range(0,$clen) as $idx)
		{
    		$code .= $tab.$tab.$tab.'}'."\n";
    	}
    	
    	// new array item
    	$code.= $tab.$tab.'$out[] = $_out;'."\n";
    	
    	// end row pivots
    	foreach(range(0,$rlen) as $idx)
		{
    		$code .= $tab.'}'."\n";
    	}
		
    	$code .= 'return $out;';
		
		//print($code);
		
    	$newfunc = create_function('&$tmp,&$out,&$columns'
									.',&$rows,&$measures,&$splits',$code);
		
		// set function memory cache
		self::$func_cache[$ckey] = $newfunc;
		
    	return $newfunc($tmp,$out,$columns,$rows,$measures,$splits);
    }
    
	/**
	 * Helper function for <MeinPivot::newFetch>
	 * Retrieves the Row field, given a record array and the Row field index.
	 * 
	 * @param array An associative array representing a Resultset record
	 * @param int The index of the Row field
	 * @return string The dimension string value of the Row field
	 */
    private function get_column_item($reg, $idx)
	{
        return $reg[$this->_pivotOn[$idx]];
    }
	
	/**
	 * Concatenates string divided by spaces and pipes.
	 * A helper funtion of <MeinPivot::build_output>
	 * 
	 * @return string  
	 */
	public static function concat_fields()
	{
    	$str = "";
    	$arr = func_get_args();
    	$num = func_num_args();
    	foreach(range(0,$num-1) as $idx){
    		$val = $arr[$idx];
    		if(!empty($val)){
    			if($idx>0) $str.=" | ";
    			$str .= $val;
    		}
    	}
    	return $str;
    }
}
