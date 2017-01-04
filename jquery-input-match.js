/**
 * 作者 davidliu 769049825@qq.com
 * 源码地址：https://github.com/davidliu0913/jquery-input-match
 * 使用说明：https://github.com/davidliu0913/jquery-input-match/blob/master/README.md
 */
(function($){
	$.fn.inputMatch=function(options){
		count++;
		objects.push(this);
		var current_count=count;
		var current_file_name='jquery-input-match.js';

		/*********定义默认参数*********/
		var default_options={
			skin:'default',
			mustSelect:false,
			maxLength:15,
			moreDataTip:'',
			timeout:300,
			matchOnFocus:false,
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

		var moreDataTip= options.moreDataTip==undefined?default_options.moreDataTip:options.moreDataTip;

		var showOnFocus=(options.showOnFocus!=undefined && (options.showOnFocus===false || options.showOnFocus===true))?options.showOnFocus:default_options.showOnFocus;

		var mustSelect=(options.mustSelect!=undefined && (options.mustSelect===false || options.mustSelect===true))?options.mustSelect:default_options.mustSelect;

		var asParam=(options.asParam!=undefined && (options.asParam===false || options.asParam===true))?options.asParam:default_options.asParam;

		var paramName=asParam?options.paramName:'';

		var match=(options.match!=undefined && (options.match===false || options.match===true))?options.match:default_options.match;

		var matchOnFocus=(options.matchOnFocus!=undefined && (options.matchOnFocus===false || options.matchOnFocus===true))?options.matchOnFocus:match;


		var repeatRequest=(options.repeatRequest!=undefined && (options.repeatRequest===false || options.repeatRequest===true))?options.repeatRequest:default_options.repeatRequest;

		var callbackFun=(options.selectCallback!=undefined && options.selectCallback!='')?options.selectCallback:'';


		/*******初始化数据******/
		//保存请求结果
		var request_datas=[];
		//输入框焦点状态
		var onFocus=false;
		//
		var onceFocus=false;
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
		var themePath=currentPath(current_file_name)+"themes/"+skin+".css";
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
			var d_length=datas.length;
			for(var i=0;i<d_length;i++){
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
			var n=0;
			var inputval=that.val();
			var hasMoreDataTip=false;

			var d_length=datas.length;
			for(var i=0;i<d_length;i++){
				if(n<length){
					var item=datas[i];

					//处理获取焦点时
					if(onceFocus && showOnFocus){
						if(matchOnFocus && inputval!=''){
							if(item.text.indexOf(inputval)!==-1){
								buildDom(item,n);
								n++;
							}
						}else{
							buildDom(item,n);
							n++;
						}
					}else{
						//处理输入时
						if(match && inputval!=''){
							var text_t=item.text.toLowerCase();
							var inputval_t=inputval.toLowerCase();
							if(text_t.indexOf(inputval_t)!==-1){
								buildDom(item,n);
								n++;
							}
						}else{
							buildDom(item,n);
							n++;
						}
					}
				}else{
					hasMoreDataTip=true;
					break;
				}
			}

			if(hasMoreDataTip && moreDataTip!=''){
				that.html=that.html+"<li more-data-tip='1'>"+moreDataTip+"</li>";
			}

			if(that.html!=''){
				//调整联想框位置
				var offset=that.offset();
				var left=offset.left;
				var top=offset.top+that.outerHeight()+5;
				that.html="<ul id='"+inputMatchBoxId+"' class='input-match-box' onmouseleave='moveOnInputMatchBox("+current_count+",0)' onmouseenter='moveOnInputMatchBox("+current_count+",1)' style='position:absolute;top:"+top+"px;left:"+left+"px'>"+that.html+"</ul>";
				$('body').append(that.html);
			}
			onceFocus=false;
		}


		//组装dom列表数据
		var buildDom=function(item,n){
			var inputval=that.val();
			//current_match_item_no===''用于列表中有相同的数据只匹配第一条
			if(inputval==item.text && that.current_match_item_position===''){
				var classx='class="on"';
				that.current_match_item_position=that.select_item_position=n;
			}else{
				var classx="";
			}

			var style=n==0?'style="border:none"':'';
			that.html=that.html+'<li '+classx+' onclick="inputMatchItemSelect('+current_count+',\''+item.value+'\',\''+item.text+'\',\''+callbackFun+'\')" onmouseover="moveOverInputMatchItem('+current_count+',$(this))" value-v="'+item.value+'" '+style+'>'+item.text+'</li>';
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
			onceFocus=true;
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
			
			if($(".input-match-box li").eq(new_position).attr('more-data-tip')==undefined){
				new_position=new_position<0?0:(new_position>max_position?max_position:new_position);
				moveOverInputMatchItem(obj_count,$(".input-match-box li").eq(new_position));
			}
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
			var d_length=d.length;
			for(var i=0;i<d_length;i++){
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
