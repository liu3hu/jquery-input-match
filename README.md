#jquery-input-match

###这是一个JQuery的插件用于处理input输入框的自动联想
- 提供定制皮肤的方式
- 待联想的数据可以是静态数据也可以是异步从服务器请求的数据
- 丰富的参数满足所有的需求


###使用说明

前端 HTML示例
```
<html>
<head>
	<title>输入框自动提示</title>
	<meta charset="utf-8">
	<script type="text/javascript" src="jquery-1.10.2.min.js"></script>
	<script type="text/javascript" src="jquery-input-match.js"></script>
</head>
<body>
	<input type="text" style="margin-top:100px;margin-left:500px;" name="a" class="input"/>
	<input type="text" style="margin-top:100px;margin-left:600px;" name="b" class="input"/>
	<script type="text/javascript">
		//通过异步请求的数据联想
		$(".input").eq(0).inputMatch({
			url:"demo.php",
			timeout:500,
			selectCallback:'demo',
			mustSelect:false,
			asParam:true,
			paramName:'x',
		});
		
		//基于静态数据联想
		$(".input").eq(1).inputMatch({
			data:[
				{value:1,text:'sfs'},
				{value:1,text:'明天dfgd啊实asdaadasdada打实大'},
				{value:1,text:'dgadfgddas'},
				{value:1,text:'qeg'},
				{value:1,text:'sfddfdad'},
				{value:1,text:'sfddfdad'},
				{value:1,text:'xbgg'},
				{value:1,text:'yudfgdghf'},
				{value:1,text:'cnsdffs'},
				{value:1,text:'rgdgdf'},
				{value:1,text:'iokjdfgdkhj'},
				{value:1,text:'qwqdfdada'},
				{value:1,text:'ujmgng'},
				{value:1,text:'cbfdfgdghn'},
			],
			timeout:500,
			selectCallback:'demo',
			mustSelect:false,
			filter:true,
			matchOnFocus:true,
			fillRightNow:false,
		});
		
		//选择后的回调函数
		function demo(value,text){
			alert("您选中了"+text);
		}
	</script>
</body>
</html>
```

后端 PHP示例 (demo.php)
```php
<?php
	$arr=array(
		array('value'=>12,'text'=>'qwer'),
		array('value'=>123,'text'=>'abcdefg'),
		array('value'=>142,'text'=>'adadfgrt5tdada'),
		array('value'=>162,'text'=>'adadagjdgsfsda'),
		);
	echo json_encode($arr);
?>
```


###参数说明

| 参数名称 | 参数值 |
| :----------|:------|
|skin|皮肤，默认default|
|data|待联想的静态数据|
|url|获取联想数据的地址 （data和url两个参数二选一，当两个参数同时有时只处理data的数据）|
|asParam|输入内容是否作为url参数（true,false 默认false）（仅有url参数时有效）|
|paramName|参数名（仅有asParam参数时有效）|
|repeatRequest|相同url是否重复请求服务器（true,false 默认false）（仅有url参数时有效）|
|timeout|停止输入后多久从服务器拉取数据 （单位毫秒 默认300）|
|matchOnFocus|输入框获得焦点时是否触发联想（true,false 默认false）|
|filter|输入内容是否作为过滤条件（true,false 默认true）|
|mustSelect|输入框的值是否必须从联想结果选择（true,false 默认false）|
|maxLength|联想结果的最大显示长度 （默认15,0则显示全部）|
|fillRightNow|鼠标或上下键在匹配结果上移动时输入框是否实时显示|
|selectCallback|选择联想结果时的回调函数 （默认空）|

- 含特殊符的数据请处理后传入 如 ' " < > 等
- 参数data或服务器返回的数据(json)的格式
```json
[
	{value:1,text:'第一名'},
	{value:2,text:'第二名'},
	{value:3,text:'第三名'}
]
```

###皮肤制作指南
- themes文件夹内新建css文件 diy.css
- diy.css的格式如下

```css
@CHARSET "UTF-8";
#diy-input-match-box{
	//your style
}

#diy-input-match-box li{
	//your style
}

#diy-input-match-box li.on{
	//your style
}
```

- 传入皮肤参数  {skin:diy}
