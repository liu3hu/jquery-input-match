(function($){
	/**
	 * 作者 davidliu 769049825@qq.com
	 * 输入框自动联想
	 * 提示：含特殊符的数据请处理后传入 如 ' " < > 等
	 * 
	 * options 参数说明 
	 * 	{
	 * 		skin:           '皮肤 默认default'
	 * 		data:           '待联想的静态数据',
	 * 		url:            '获取联想数据的地址 （data和url两个参数二选一，当两个参数同时有时只处理data的数据）',
	 *		asParam:        '输入内容是否作为url参数（true,false 默认false）（仅有url参数时有效）',
	 *		paramName		'参数名（仅有asParam参数时有效）'
	 *		repeatRequest:  '相同url是否重复请求服务器（true,false 默认false）（仅有url参数时有效）',
	 * 		timeout:        '停止输入后多久从服务器拉取数据 （单位毫秒 默认300）',
	 * 		matchOnFocus:   '输入框获得焦点时是否触发联想（true,false 默认false）',
	 * 		filter:         '输入内容是否作为过滤条件（true,false 默认true）',
	 * 		mustSelect:     '输入框的值是否必须从联想结果选择（true,false 默认false）',
	 * 		maxlength:      '联想结果的最大显示长度 （默认15,0则显示全部）',
	 * 		fillRightNow:   '鼠标或上下键在匹配结果上移动时输入框是否实时显示',
	 * 		selectCallback: '选择联想结果时的回调函数 （默认空）'
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
		var default_options={
			skin:'default',
			mustSelect:false,
			maxlength:15,
			timeout:300,
			matchOnFocus:false,
			asParam:false,
			filter:true,
			repeatRequest:false,
			fillRightNow:false
		};

		if(options.data!=undefined && options.url!=undefined){
			console.log('data或url至少填1个');
			return false;
		}

		if(options.timeout==undefined){
			var timeout=default_options.timeout;
		}else{
			var timeout=parseInt(options.timeout);
			var timeout=isNaN(timeout)?default_options.timeout:timeout;
		}

		if(options.data!=undefined){
			timeout=0;
		}

		if(options.maxlength==undefined){
			var maxlength=default_options.maxlength;
		}else{
			var maxlength=parseInt(options.maxlength);
			var maxlength=isNaN(maxlength)?default_options.maxlength:maxlength;
		}

		var matchOnFocus=(options.matchOnFocus!=undefined && (options.matchOnFocus===false || options.matchOnFocus===true))?options.matchOnFocus:default_options.matchOnFocus;

		var mustSelect=(options.mustSelect!=undefined && (options.mustSelect===false || options.mustSelect===true))?options.mustSelect:default_options.mustSelect;

		var asParam=(options.asParam!=undefined && (options.asParam===false || options.asParam===true))?options.asParam:default_options.asParam;

		var paramName=asParam?options.paramName:'';

		var filter=(options.filter!=undefined && (options.filter===false || options.filter===true))?options.filter:default_options.filter;

		var repeatRequest=(options.repeatRequest!=undefined && (options.repeatRequest===false || options.repeatRequest===true))?options.repeatRequest:default_options.repeatRequest;

		fillRightNow=(options.fillRightNow!=undefined && (options.fillRightNow===false || options.fillRightNow===true))?options.fillRightNow:default_options.fillRightNow;

		callbackFun=(options.selectCallback!=undefined && options.selectCallback!='')?options.selectCallback:'';

		/*******初始化数据******/

		//保存请求结果
		var request_datas=[];

		//输入框焦点状态
		var onFocus=false;

		var timestamp=0;

		//是否正在请求标识
		var requesting=0;

		var that=this;
		inputObj=this;


		//初始化匹配结果
		var datas=[];
		if(options.data!=undefined){
			datas=datasCheck(options.data)
			if(datas===false){
				return false;
			}
		}


		//OK
		//验证输入内容是否在匹配结果中
		var matchCheck=function(){
			var inputVal=that.val();
			for(i in datas){
				if(inputVal==datas[i]['text']){
					return true;
				}
			}
			return false;
		}

		
		var skin=options.skin==undefined?'default':options.skin;
		var themePath=currentPath('jquery-input-match.js')+"themes/"+skin+".css";
		var theme_load_flag=true;
		for(var i=0;i<$("head link").length;i++){
			if($("head link").eq(i).attr('input-match-skin')!=undefined && $("head link").eq(i).attr('input-match-skin')==skin){
				theme_load_flag=false;
				break
			}
		}
		if(theme_load_flag){
			$("head").append("<link rel='stylesheet' input-match-skin='"+skin+"' type='text/css' href='"+themePath+"'>");
		}
		inputMatchBoxId=skin+'-input-match-box';


		//url请求参数
		var p={};
		var getRequestkey=function(){
			var last_input_queue=input_queue[input_queue.length-1]==undefined?'':input_queue[input_queue.length-1];
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
			
			input_queue_length=input_queue.length;

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
								if(input_queue.length!=0 && onFocus){
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
		//显示联想数据
		var showData=function(){
			blurHandle();

			var length=maxlength<datas.length?maxlength:datas.length;
			var n=1;
			var inputval=that.val();
			for(i in datas){
				if(n<=length){
					var item=datas[i];


					if(filter && inputval!=''){
						
						if(item.text.indexOf(inputval)!==-1){
							
							if(inputval==item.text && current_match_item_no===''){
								var classx='class="on"';
								current_match_item_no=select_item_position=n-1;
							}else{
								var classx="";
							}
							

							var style=n==1?'style="border:none"':'';
							html=html+'<li '+classx+' onclick="inputMatchItemSelect(\''+item.value+'\',\''+item.text+'\',\''+callbackFun+'\')" onmouseover="moveOnInputMatchItem($(this),1)" onmouseout="moveOnInputMatchItem($(this),0)" value-v="'+item.value+'" '+style+'>'+item.text+'</li>';
							n++;
						}
					}else{

						
						if(inputval==item.text && current_match_item_no===''){
							var classx='class="on"';
							current_match_item_no=select_item_position=n-1;
						}else{
							var classx="";
						}
						

						var style=n==1?'style="border:none"':'';
						html=html+'<li '+classx+' onclick="inputMatchItemSelect(\''+item.value+'\',\''+item.text+'\',\''+callbackFun+'\')" onmouseover="moveOnInputMatchItem($(this),1)" onmouseout="moveOnInputMatchItem($(this),0)" value-v="'+item.value+'" '+style+'>'+item.text+'</li>';
						n++;
					}
				}else{
					break;
				}
			}

			if(html!=''){
				//调整联想框位置
				var offset=that.offset();
				var left=offset.left;
				var top=offset.top+that.outerHeight()+5;

				html="<ul id='"+inputMatchBoxId+"' class='input-match-box' onmouseleave='moveOnInputMatchBox(0)' onmouseenter='moveOnInputMatchBox(1)' style='position:absolute;top:"+top+"px;left:"+left+"px'>"+html+"</ul>";
				
				$('body').append(html);
				
			}
		}





		//定时器
		var timer=function (){
			if(timeout>0){
				var current_timestamp=new Date().getTime();


				//获取key
				var request_data_key=getRequestkey();
				if(options.data==undefined && options.url!=undefined && !repeatRequest && request_datas[request_data_key]!=undefined){
					datas=request_datas[request_data_key];
					showData();

				}else{
					if(current_timestamp-timestamp>=timeout){
					
						if(input_queue.length>input_queue_length){
							if(requesting==1){
								setTimeout(timer(),50);
							}else{
								getData();
								//setTimeout(timer(),50);
							}
						}else{
							showData();
						}
					}else{
						setTimeout(function(){timer()},50);
					}
				}
			}else{
				if(input_queue.length>input_queue_length){
					if(requesting==1){
						setTimeout(timer(),50);
					}else{
						getData();
					}
				}else{
					showData();
				}
			}
		}


		//OK
		//监听键盘输入
		this.keyup(function(e){
			if(e.keyCode==13){
				if(!fillRightNow && select_item_position!==''){
					inputMatchItemSelect($("#"+inputMatchBoxId+" li").eq(select_item_position).attr('v-value'),$("#"+inputMatchBoxId+" li").eq(select_item_position).text(),callbackFun);
				}
				return false;
			}else{


				if(e.keyCode==38 || e.keyCode==40 ){
					moveSelectInputMatchItem(e.keyCode);
				}else{
					if($("#"+inputMatchBoxId).length>0){
						$("#"+inputMatchBoxId).hide();
					}
					timestamp=new Date().getTime();
					if(options.data!=undefined ){
						//timer();
							input_queue.push(that.val());
							if(input_queue.length==1){
								//启动后定时器
								timer();
							}
					}else{
						if(options.url!=undefined && options.url!=''){
							input_queue.push(that.val());
							if(input_queue.length==1){
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
			
		})


		//OK
		//监听获得焦点
		this.focus(function(e){
			onFocus=true;
			if(matchOnFocus){
				if(options.data!=undefined ){
					input_queue.push(that.val());
					timer();
				}else{
					if(options.url!=undefined && options.url!=''){
						input_queue.push(that.val());
						timer();
					}
				}
			}
		})


		//OK
		//监听失去焦点
		this.blur(function(e){
			onFocus=false;
			if(!on_auto_box){
				if(mustSelect){
					if(datas.length>0 && matchCheck()){
					
					}else{
						that.val('');
					}
				}
				blurHandle();
			}
		})
	}


	var on_auto_box=false;
	var html='';
	//定义请求时输入队列的长度
	var input_queue_length=0;
	//输入队列
	var input_queue=[];
	//输入框对应匹配结果序号
	var current_match_item_no='';

	//当前指向item的位置
	var select_item_position='';





	var inputMatchBoxId='';
	
	var inputObj='';
	//选择item时输入框是否实时显示
	var fillRightNow=false;

	var callbackFun='';

	//上下键选择
	window.moveSelectInputMatchItem=function(keycode){
		if($("#"+inputMatchBoxId).length>0 && (keycode==38 || keycode==40)){
			
			//var current_position=select_item_position===''?current_match_item_no:select_item_position;


			var mix_position=0;
			var max_position=$("#"+inputMatchBoxId+" li").length-1;
			if(keycode==38){
				var new_position=select_item_position===''?0:select_item_position-1;
			}
			if(keycode==40){
				var new_position=select_item_position===''?0:select_item_position+1;
			}
			new_position=new_position<0?0:(new_position>max_position?max_position:new_position);
			//select_item_position=new_position;
			moveOnInputMatchItem($("#"+inputMatchBoxId+" li").eq(new_position),1);
			
		}
	}

	window.moveOnInputMatchBox=function(on){
		if(on==1){
			on_auto_box=true;
		}else{
			on_auto_box=false;

			if(!fillRightNow){
				select_item_position=current_match_item_no;
				$("#"+inputMatchBoxId+" li").removeClass('on');
				if(current_match_item_no!=''){
					$("#"+inputMatchBoxId+" li").eq(current_match_item_no).addClass('on');
				}
			}
			
			
		}
	}


	window.moveOnInputMatchItem=function(obj,status){
		if(status==1){
			$("#"+inputMatchBoxId+" li").removeClass('on');
			obj.addClass('on');

			select_item_position=$("#"+inputMatchBoxId+" li").index(obj);

			if(fillRightNow){
				current_match_item_no=select_item_position;
				inputObj.val(obj.text());
			}
			
		}else{
			//obj.removeClass('on');
		}
		
	}


	window.inputMatchItemSelect=function(value,text,callback){
		inputObj.val(text);

		blurHandle();

		inputObj.blur();

		if(callback!=''){
			eval(callback+"('"+value+"','"+text+"')");
		}
	}

	//失去焦点处理
	function blurHandle(){
		if($("#"+inputMatchBoxId).length>0){
			$("#"+inputMatchBoxId).remove();
			$("#"+inputMatchBoxId+" li").removeClass('on');
		}
		on_auto_box=false;
		input_queue=[];
		input_queue_length=0;
		html='';
		current_match_item_no='';
		select_item_position='';
	}

	//OK
	//判断变量是否为数组
	function isArray(a){
		return Array.isArray ? Array.isArray(a) : Object.prototype.toString.call(a) === '[object Array]';
	}

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
	//验证匹配数据格式
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