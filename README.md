#jquery-input-match

###jquery-input-match是一个JQuery的插件用于处理根据input输入框内容实时显示与之匹配的数据条目
- 提供定制皮肤的方式
- 待匹配的数据可以是静态数据也可以是异步从服务器请求的数据
- 丰富的参数满足所有的需求


###使用说明

前端 HTML示例
```
<html>
<head>
	<title>输入框自动提示</title>
	<meta charset="utf-8">
	<script type="text/javascript" src="../jquery-1.10.2.min.js"></script>
	<script type="text/javascript" src="../jquery-input-match.min.js"></script>
</head>
<body>
	<input type="text" style="margin-top:100px;margin-left:500px;" name="a" class="input"/>
	<input type="text" style="margin-top:100px;margin-left:600px;" name="b" class="input"/>
	<script type="text/javascript">
		//异步请求的数据作为待匹配的数据
		$(".input").eq(0).inputMatch({
			url:"demo.php",
			timeout:500,
			selectCallback:'demo',
			mustSelect:false,
			asParam:true,
			paramName:'x',
		});
		
		//静态数据作为待匹配的数据
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
		
		//选择数据条目后的回调函数
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

| 参数名称 |是否必填|可选值|默认值| 参数值 |
| :----------|:------|:------|:------|:------|
|skin|否||default|皮肤，默认default|
|data|无url参数时必填|||待匹配的静态数据|
|url|无data参数时必填|||获取待匹配数据的地址 (data和url两个参数二选一，当两个参数同时传入时只处理data的数据)|
|asParam|否|true,false|false|输入内容是否作为url参数(与url参数一同传入时才生效)|
|paramName|否|||参数名 (与asParam参数一同传入时才生效)|
|repeatRequest|否|true,false|false|相同url是否重复请求服务器 (与url参数一同传入时才生效)|
|timeout|否|0或正整数|300|停止输入后多久从服务器拉取数据 (单位毫秒)|
|showOnFocus|否|true,false|false|输入框获得焦点时是否触发显示数据列表|
|matchOnFocus|否|true,false|false|获得焦点时是否根据输入框内容匹配显示数据列表 (与showOnFocus参数一同传入时才生效)|
|match|否|true,false|true|数据列表是否只显示与输入内容相匹配的条目|
|mustSelect|否|true,false|false|输入框的值是否必须从数据列表中选择|
|maxLength|否|0或正整数|15|数据列表的最大显示长度 (0则显示全部)|
|moreDataTip|否|||当匹配上的数据条数大于maxLength时显示的提示的信息|
|fillRightNow|否|true,false|flase|鼠标或上下键在数据列表上移动时输入框是否实时显示|
|selectCallback|否|||选择数据时的回调函数|

#提示
- 当input控件在表单内，使用上下键选择数据后回车选中时，会阻止表单提交的默认行为，如需在选中后提交表单请在回调函数中处理
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
- themes文件夹内新建css文件 styleName.css
- styleName.css的格式如下

```css
@CHARSET "UTF-8";
#styleName-input-match-box{
	//your style
}

#styleName-input-match-box li{
	//your style
}

#styleName-input-match-box li.on{
	//your style
}
```

- 传入皮肤参数  {skin:styleName}
