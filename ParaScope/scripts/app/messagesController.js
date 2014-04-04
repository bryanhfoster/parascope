define(["app/communicationManager"],
function (communicationManager) {  
   var me = {
        init: function(appController, element){
            me.getPredefinedMessages();
        },
        viewModel: kendo.observable({
            userMessage: null,
            predefinedMessages: null,
            messages: null,
            numberOfMessages:function(){
                var messages = me.viewModel.get("messages");
                if(messages != null){
                    if(messages.length>0){
                        return messages.length;
                    }else{
                        false;
                    }
                }
                return false;
            },
            cancelSendPredefinedMessage: function(e){
                kendoApp.navigate("#messagesView");
            },
            showPredefinedMessageView:function(){
                kendoApp.navigate("#predefinedMessageView");                
            },
            sendMessage: function(e){
                //Go to storage get routeupdate and push message into object & save
                var messageId = e.data.Id;
                me.sendPredefinedMessage(messageId);
                //me.setUserMessage("Your messge has been sent");
                alert("Your messge has been sent.");
                kendoApp.navigate("#messagesView");
            },
            messageReplyClick: function(e){
                var messageId = e.data.Id;
                var answer = e.currentTarget.innerHTML;
                if(answer === "Dismiss"){
                     me.acknowledgeMessage(null,messageId,true);
                    var newMessages = $.grep(this.messages,function(element,index){
                        return element.Id != messageId;
                    });
                    me.viewModel.set("messages",newMessages);
                    //var tabstrip = $("#messagesTab > .km-badge");           
                    //if(newMessages.length > 0){
                    //    tabstrip.show(); 
                    //    tabstrip.html(newMessages.length);                
                    //} else{                
                    //    tabstrip.hide();
                    //}
                          
                    if (tabstrip != null){
                        tabstrip.badge(1, newMessages.length > 0 ? newMessages.length : false);                
                    }
                }
                else{
                    me.acknowledgeMessage(answer,messageId,false);
                    
                    var messageIndex;
                    $.grep(me.viewModel.get("messages"),function(element,index){
                        if(element.Id == messageId){
                            messageIndex = index;
                        }
                    });
                    me.viewModel.get("messages")[messageIndex].set("Answered", true);
                }
            }
        }),
        acknowledgeMessage: function(answer, messageId, dismiss){
            //write route update and save
            communicationManager.addReplyToMessage(answer, messageId, dismiss);
        },
        sendPredefinedMessage: function(messageId){
            //Bind & show list
            communicationManager.addMessage(messageId);
        },
        getPredefinedMessages: function(){
            var preDefinedMessages = communicationManager.getPredefinedMessages();
            me.viewModel.set("predefinedMessages",preDefinedMessages);
        },
        getMessages: function() {
            var messagesBefore = me.viewModel.get("messages");
            var messages = communicationManager.getMessages();
            if(messagesBefore && messages.length > messagesBefore.length){
                navigator.notification.beep(2)
            }
            //$("#messagesTab")[0].innerHTML("<span class='km-icon km-organize'>test</span>");
                        
            if (tabstrip != null){
                tabstrip.badge(1, messages.length > 0 ? messages.length : false);          
            }
        	me.viewModel.set("messages", messages);
            //var tabstrip = $("#messagesTab > .km-badge");           
            //if(messages.length > 0){
            //    tabstrip.show(); 
            //    tabstrip.html(messages.length);                
            //} else{                
            //    tabstrip.hide();
            //}
            
        },
        setUserMessage: function(message){
            me.viewModel.set("userMessage",message);
            setTimeout(function() {
              me.viewModel.set("userMessage","");
            }, 3000);
        }
   };
    
    return me;
});