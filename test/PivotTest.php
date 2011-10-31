<?php
//error_reporting(0);

$sep = DIRECTORY_SEPARATOR;

require_once 'PHPUnit.php';
require_once("..${sep}MeinPivot.php");

class MeinPivotTest extends PHPUnit_TestCase{
	
	private $result1 = array(
		    array('host' => 'host1', 'country' => 'fr', 'year' => 2010,
		        'month' => 1, 'clicks' => 123, 'users' => 4),
		
		    array('host' => 'host1', 'country' => 'fr', 'year' => 2010,
		        'month' => 2, 'clicks' => 134, 'users' => 5),
		
		    array('host' => 'host1', 'country' => 'fr', 'year' => 2010,
		        'month' => 3, 'clicks' => 341, 'users' => 2),
		
		    array('host' => 'host1', 'country' => 'es', 'year' => 2010,
		        'month' => 1, 'clicks' => 113, 'users' => 4),
		
		    array('host' => 'host1', 'country' => 'es', 'year' => 2010,
		        'month' => 2, 'clicks' => 234, 'users' => 5),
		
		    array('host' => 1, 'country' => 'es', 'year' => 2010,
		        'month' => 3, 'clicks' => 421, 'users' => 2),
		
		    array('host' => 'host1', 'country' => 'es', 'year' => 2010,
		        'month' => 4, 'clicks' => 22,  'users' => 3),
		
		    array('host' => 'host2', 'country' => 'es', 'year' => 2010,
		        'month' => 1, 'clicks' => 111, 'users' => 2),
		
		    array('host' => 'host2', 'country' => 'es', 'year' => 2010,
		        'month' => 2, 'clicks' => 2,   'users' => 4),
		
		    array('host' => 'host3', 'country' => 'es', 'year' => 2010,
		        'month' => 3, 'clicks' => 34,  'users' => 2),
		
		    array('host' => 'host3', 'country' => 'es', 'year' => 2010,
		        'month' => 4, 'clicks' => 1,   'users' => 1),
		);
	
	private $result2 = array(
		array('BlogName' => 'SuicideBooth','Location'=>'Portugal','Age'=>'18'
			,'Gender'=>'M','Visits'=>10,'Pageviews'=>16,'Hits'=>2),
		array('BlogName' => 'SuicideBooth','Location'=>'Portugal','Age'=>'21'
			,'Gender'=>'M','Visits'=>8,'Pageviews'=>10,'Hits'=>3)
	);
	
    function __construct($name){
        $this->PHPUnit_TestCase($name);
        
        parent::PHPUnit_TestCase($name);
    }
    
    function testPivot1(){
		
    	$columns = array('year','month');
    	$rows = array('country','host');
    	$measures = array('users','clicks');
    	
    	$pivot = new MeinPivot($this->result1,$columns,$rows,$measures);
		$out = $pivot->get();
		
    	print("output1: ".print_r($out,true));
		$this->assertTrue(is_array($out));
    }
	
	function testPivot2(){
		
    	$columns = array('year','month');
    	$rows = array('country','host');
    	$measures = array('users','clicks');
    	
    	$pivot = new MeinPivot($this->result1,$columns,$rows,$measures);
		$out = $pivot->get();
		
    	print("output2: ".print_r($out,true));
		$this->assertTrue(is_array($out));
    }
	
	function testPivot3(){
		
    	$columns = array('Age','Gender');
    	$rows = array('BlogName','Location');
    	$measures = array('Visits','Pageviews','Hits');
    	
    	$pivot = new MeinPivot($this->result2,$columns,$rows,$measures);
		$out = $pivot->get();
		
    	print("output3: ".print_r($out,true));
		$this->assertTrue(is_array($out));
    }
    
}

$suite = new PHPUnit_TestSuite('MeinPivotTest');
$phpu = new PHPUnit();
$result = $phpu->run($suite);
print $result->toString();
?>