(function($){
	/**
	 * 作者 davidliu 769049825@qq.com
	 * 代码地址：https://github.com/davidliu0913/jquery-input-match
	 * 
	 * 输入框自动联想
	 * options 参数说明 
	 * 	{
	 * 		skin:           '皮肤，默认default'
	 * 		data:           '待匹配的静态数据',
	 * 		url:            '获取待匹配数据数据的地址 (data和url两个参数二选一，当两个参数同时传入时只处理data的数据)',
	 *		asParam:        '输入内容是否作为url参数:true,false 默认false (与url参数一同传入时才生效)',
	 *		paramName		'参数名 (与asParam参数一同传入时才生效)'
	 *		repeatRequest:  '相同url是否重复请求服务器:true,false 默认false (与url参数一同传入时才生效)',
	 * 		timeout:        '停止输入后多久从服务器拉取数据 (单位毫秒 默认300)',
	 * 		showOnFocus:    '输入框获得焦点时是否触发显示数据列表:true,false 默认false',
	 * 		match:          '数据列表是否只显示与输入内容相匹配的条目:true,false 默认true',
	 * 		mustSelect:     '输入框的值是否必须从数据列表中选择:true,false 默认false',
	 * 		maxLength:      '数据列表的最大显示长度 (默认15,0则显示全部)',
	 * 		fillRightNow:   '鼠标或上下键在数据列表上移动时输入框是否实时显示',
	 * 		selectCallback: '选择数据时的回调函数 (默认空)'
	 * 	}
	 * 	参数data或服务器返回的数据(json)的格式为数组
	 * 	[
	 * 		{value:1,text:'第一名'},
	 * 		{value:2,text:'第二名'},
	 * 		{value:3,text:'第三名'}
	 * 	]
	 * @param  {object} options 
	 * @return {void}
	 */
	
	$.fn.inputMatch=function(options){
		count++;
		objects.push(this);
		var current_count=count;


		/*********定义默认参数*********/
		var default_options={
			skin:'default',
			mustSelect:false,
			maxLength:15,
			timeout:300,
			showOnFocus:false,
			asParam:false,
			match:true,
			repeatRequest:false,
			fillRightNow:false
		};


		/*********参数处理***********/
		if(options.data!=undefined && options.url!=undefined){
			console.log('data或url至少填1个');
			return false;
		}
		//初始化匹配结果
		var datas=[];
		if(options.data!=undefined){
			datas=datasCheck(options.data)
			if(datas===false){
				return false;
			}
		}

		if(options.timeout==undefined){
			var timeout=default_options.timeout;
		}else{
			var timeout=parseInt(options.timeout);
			var timeout=isNaN(timeout)?default_options.timeout:timeout;
		}
		//如果为静态数据则不做延时处理
		if(options.data!=undefined){
			timeout=0;
		}

		if(options.maxLength==undefined){
			var maxLength=default_options.maxLength;
		}else{
			var maxLength=parseInt(options.maxLength);
			var maxLength=isNaN(maxLength)?default_options.maxLength:maxLength;
		}

		var showOnFocus=(options.showOnFocus!=undefined && (options.showOnFocus===false || options.showOnFocus===true))?options.showOnFocus:default_options.showOnFocus;

		var mustSelect=(options.mustSelect!=undefined && (options.mustSelect===false || options.mustSelect===true))?options.mustSelect:default_options.mustSelect;

		var asParam=(options.asParam!=undefined && (options.asParam===false || options.asParam===true))?options.asParam:default_options.asParam;

		var paramName=asParam?options.paramName:'';

		var match=(options.match!=undefined && (options.match===false || options.match===true))?options.match:default_options.match;

		var repeatRequest=(options.repeatRequest!=undefined && (options.repeatRequest===false || options.repeatRequest===true))?options.repeatRequest:default_options.repeatRequest;

		var callbackFun=(options.selectCallback!=undefined && options.selectCallback!='')?options.selectCallback:'';


		/*******初始化数据******/
		//保存请求结果
		var request_datas=[];
		//输入框焦点状态
		var onFocus=false;
		var timestamp=0;
		//是否正在请求标识
		var requesting=0;
		var that=this;


		/*********定义供外部调用的对象属性**********/
		this.on_match_box=false;
		this.html='';
		//请求发起时输入队列的长度
		this.input_queue_length=0;
		//输入队列
		this.input_queue=[];
		this.current_match_item_position='';
		this.select_item_position='';
		this.fillRightNow=(options.fillRightNow!=undefined && (options.fillRightNow===false || options.fillRightNow===true))?options.fillRightNow:default_options.fillRightNow;


		/**********皮肤处理*********/
		var skin=options.skin==undefined?'default':options.skin;
		var themePath=currentPath('jquery-input-match.js')+"themes/"+skin+".css";
		var theme_load_flag=true;
		for(var i=0;i<$("head link").length;i++){
			if($("head link").eq(i).attr('input-match-skin')!=undefined && $("head link").eq(i).attr('input-match-skin')==skin){
				theme_load_flag=false;
				break;
			}
		}
		if(theme_load_flag){
			$("head").append("<link rel='stylesheet' input-match-skin='"+skin+"' type='text/css' href='"+themePath+"'>");
		}
		var inputMatchBoxId=skin+'-input-match-box';


		//OK
		//验证输入内容是否与数据列表匹配
		var matchCheck=function(){
			var inputVal=that.val();
			for(i in datas){
				if(inputVal==datas[i]['text']){
					return true;
				}
			}
			return false;
		}


		//url请求参数
		var p={};
		//根据url生成请求标识  用于判断相同url是否重复请求
		var getRequestkey=function(){
			var last_input_queue=that.input_queue[that.input_queue.length-1]==undefined?'':that.input_queue[that.input_queue.length-1];
			if(asParam && paramName!=''){
				p[paramName]=last_input_queue;
				return escape(options.url+paramName+last_input_queue);
			}else{
				return escape(options.url);
			}
		}


		//OK
		//获取服务器数据
		var getData=function(){
			that.input_queue_length=that.input_queue.length;
			var request_data_key=getRequestkey();
			if(options.data==undefined){
				if(options.url!=undefined){
					if(repeatRequest || (!repeatRequest && request_datas[request_data_key]==undefined) ){
						requesting=1;
						$.getJSON(
							options.url, 
							p,
							function(json){
								requesting=0;
								if(that.input_queue.length!=0 && onFocus){
									var d=datasCheck(json);
									if(d!==false){
										datas=d;
										request_datas[request_data_key]=datas;
										timer();
									}
								}
							}
						);
					}else{
						datas=request_datas[request_data_key];
						timer();
					}
				}
			}else{
				timer();
			}
		}


		//OK
		//渲染数据列表
		var showData=function(){
			init(current_count);

			var length=maxLength<datas.length?maxLength:datas.length;
			var n=1;
			var inputval=that.val();
			for(i in datas){
				if(n<=length){
					var item=datas[i];
					if(match && inputval!=''){
						if(item.text.indexOf(inputval)!==-1){
							buildDom(item,n);
							n++;
						}
					}else{
						buildDom(item,n);
						n++;
					}
				}else{
					break;
				}
			}

			if(that.html!=''){
				//调整联想框位置
				var offset=that.offset();
				var left=offset.left;
				var top=offset.top+that.outerHeight()+5;
				that.html="<ul id='"+inputMatchBoxId+"' class='input-match-box' onmouseleave='moveOnInputMatchBox("+current_count+",0)' onmouseenter='moveOnInputMatchBox("+current_count+",1)' style='position:absolute;top:"+top+"px;left:"+left+"px'>"+that.html+"</ul>";
				$('body').append(that.html);
			}
		}


		//组装dom列表数据
		var buildDom=function(item,n){
			var inputval=that.val();
			//current_match_item_no===''用于列表中有相同的数据只匹配第一条
			if(inputval==item.text && that.current_match_item_position===''){
				var classx='class="on"';
				that.current_match_item_position=that.select_item_position=n-1;
			}else{
				var classx="";
			}

			var style=n==1?'style="border:none"':'';
			that.html=that.html+'<li '+classx+' onclick="inputMatchItemSelect('+current_count+',\''+item.value+'\',\''+item.text+'\',\''+callbackFun+'\')" onmouseover="moveOverInputMatchItem('+current_count+',$(this))" value-v="'+item.value+'" '+style+'>'+item.text+'</li>';
			n++;
		} 


		//定时器
		var timer=function (){
			if(timeout>0){
				//判断是否读取已保存的数据忽略延时
				var request_data_key=getRequestkey();
				if(options.data==undefined && options.url!=undefined && !repeatRequest && request_datas[request_data_key]!=undefined){
					datas=request_datas[request_data_key];
					showData();
				}else{
					//延时处理
					var current_timestamp=new Date().getTime();
					if(current_timestamp-timestamp>=timeout){
						timerHandle();
					}else{
						setTimeout(function(){timer();},50);
					}
				}
			}else{
				timerHandle();
			}
		}


		//处理数据请求与渲染
		var timerHandle=function(){
			//如果当前输入队列大于 当前请求发起时的队列长度 则继续请求数据
			if(that.input_queue.length>that.input_queue_length){
				if(requesting==1){
					setTimeout(function(){timer();},50);
				}else{
					getData();
				}
			}else{
				showData();
			}
		}


		//回车选中配件时阻止提交表单的默认行为  如需回车选中后提交表单请在回调函数中处理
		this.keydown(function(e){
			if(e.keyCode==13){
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		})

		//OK
		//监听键盘输入
		this.keyup(function(e){
			//上下键移动后使用回车选择
			if(e.keyCode==13){
				if(that.select_item_position!==''){
					inputMatchItemSelect(current_count,$(".input-match-box li").eq(that.select_item_position).attr('value-v'),$(".input-match-box li").eq(that.select_item_position).text(),callbackFun);
				}
			}else{
				//监听上下键移动
				if(e.keyCode==38 || e.keyCode==40 ){
					moveSelectInputMatchItem(current_count,e.keyCode);
				}else{
					//避免快速输入时 列表显示还停留在之前的匹配数据  异步请求出现延时时会出现此情况
					if($(".input-match-box").length>0){
						$(".input-match-box").hide();
					}
					timestamp=new Date().getTime();


					if(options.data!=undefined ){
						that.input_queue.push(that.val());
						if(that.input_queue.length==1){
							//启动后定时器
							timer();
						}
					}else{
						if(options.url!=undefined && options.url!=''){
							that.input_queue.push(that.val());
							if(that.input_queue.length==1){
								//启动后定时器
								timer();
							}else{
								var request_data_key=getRequestkey();
								if(options.data==undefined && options.url!=undefined && !repeatRequest && request_datas[request_data_key]!=undefined){
									datas=request_datas[request_data_key];
									showData();
								}
							}
						}
					}
				}
			}
			e.preventDefault();
			e.stopPropagation();
			return false;
		})


		//OK
		//监听获得焦点
		this.focus(function(e){
			onFocus=true;
			if(showOnFocus){
				if(options.data!=undefined ){
					that.input_queue.push(that.val());
					timer();
				}else{
					if(options.url!=undefined && options.url!=''){
						that.input_queue.push(that.val());
						timer();
					}
				}
			}
		})


		//OK
		//监听失去焦点
		this.blur(function(e){
			onFocus=false;
			//判断是否由列表框上的点击引起的失焦，如果不是则执行
			if(!that.on_match_box){
				if(mustSelect){
					if(datas.length>0 && matchCheck()){
					
					}else{
						that.val('');
					}
				}
				init(current_count);
			}
		})
	}


	var count=-1;
	var objects=[];

	var current_object='';

	//select_item_position  鼠标或上下键当前指向的数据条目位置
	//current_match_item_position 与输入框内容完全匹配的数据条目的位置
	//on_match_box 当前鼠标是否在数据列表上
	

	//dom操作函数  供全局使用

	//上下键选择数据条目
	window.moveSelectInputMatchItem=function(obj_count,keycode){
		getCurrentObject(obj_count);

		if($(".input-match-box").length>0 && (keycode==38 || keycode==40)){
			var mix_position=0;
			var max_position=$(".input-match-box li").length-1;

			var new_position=current_object.select_item_position===''?0:(keycode==38?current_object.select_item_position-1:current_object.select_item_position+1);
			
			new_position=new_position<0?0:(new_position>max_position?max_position:new_position);
			moveOverInputMatchItem(obj_count,$(".input-match-box li").eq(new_position));
		}
	}

	//移入移出数据列表框
	window.moveOnInputMatchBox=function(obj_count,on){
		getCurrentObject(obj_count);
		if(on==1){
			current_object.on_match_box=true;
		}else{
			current_object.on_match_box=false;
			if(!current_object.fillRightNow){
				current_object.select_item_position=current_object.current_match_item_position;
				$(".input-match-box li").removeClass('on');
				if(current_object.current_match_item_position!==''){
					$(".input-match-box li").eq(current_object.current_match_item_position).addClass('on');
				}
			}
		}
	}

	//移入数据条目
	window.moveOverInputMatchItem=function(obj_count,obj){
		getCurrentObject(obj_count);

		$(".input-match-box li").removeClass('on');
		obj.addClass('on');

		current_object.select_item_position=$(".input-match-box li").index(obj);

		if(current_object.fillRightNow){
			current_object.current_match_item_position=current_object.select_item_position;
			current_object.val(obj.text());
		}
	}

	//选择数据条目
	window.inputMatchItemSelect=function(obj_count,value,text,callback){
		getCurrentObject(obj_count);
		current_object.val(text);
		init(obj_count);
		current_object.blur();
		if(callback!=''){
			eval(callback+"('"+value+"','"+text+"')");
		}
	}

	


	//工具函数闭包内使用

	//初始化数据
	function init(obj_count){
		current_object=objects[obj_count];

		if($(".input-match-box").length>0){
			$(".input-match-box").remove();
			$(".input-match-box li").removeClass('on');
		}
		current_object.on_match_box=false;
		current_object.input_queue=[];
		current_object.input_queue_length=0;
		current_object.html='';
		current_object.current_match_item_position='';
		current_object.select_item_position='';
	}

	//获取当前input空间对象
	function getCurrentObject(obj_count){
		current_object=objects[obj_count];
	}

	//OK
	//判断变量是否为数组
	function isArray(a){
		return Array.isArray ? Array.isArray(a) : Object.prototype.toString.call(a) === '[object Array]';
	}

	//获取当前文件路径
	function currentPath(currentfile){
		var js=document.scripts;
		var jsPath;
		for(var i=js.length;i>0;i--){
		 	if(js[i-1].src.indexOf(currentfile)>-1){
			jsPath=js[i-1].src.substring(0,js[i-1].src.lastIndexOf("/")+1);
		 	}
		}
		return jsPath;
	}

	//OK
	//验证数据格式
	function datasCheck(d){
		if(isArray(d)){
			for(i in d){
				if(d[i]['text']==undefined || d[i]['value']==undefined ){
					console.log('数据格式错误');
					return false;
				}else{
					/*
					过滤数据
					var value=d[i]['value'].toString();
					var valuex=value.replace(/'/g, "\'").replace(/"/g, '\"');
					d[i]['value']=valuex;

					var text=d[i]['text'].toString();
					var textx=text.replace(/'/g, "\'").replace(/"/g, '\"');
					d[i]['text']=textx;
					*/
				}
			}
			return d;
		}else{
			console.log('数据格式错误');
			return false;
		}
	}

})(jQuery);