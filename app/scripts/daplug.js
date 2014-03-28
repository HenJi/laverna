var terminalFactory = new ChromeapiPlugupCardTerminalFactory(),
currentCard = undefined,
secureChannel = undefined,
currentSC = undefined;
String.prototype.repeat = function(times) {
    return (new Array(times + 1)).join(this);
};
(function(window, document, undef){

    /**
     * If already loaded, don't load it again
     */
    if (typeof window.DP !== typeof undef) return;

    var DP = function(){

        var initCard = function(reader, on_success, on_fail){
            if (typeof currentCard != "undefined") {
                console.log("Disconnecting previous card")
                currentCard.disconnect().then(function() {
					currentCard = undefined;
					initCard(reader, on_success, on_fail)
				});
            } else {
                console.log("Connecting to card")
                terminalFactory.getCardTerminal(reader).getCard().then(
                    function(card){
                        console.log("Connected to card")
                        currentCard = card
                        on_success()
                    }, on_fail)
            }
        }

        var scan = function(on_success, on_fail){
            function aux(i){
                if (i > 10) {
                    console.log("Cannot start Chrome extension")
                    on_fail()
                } else if (typeof(terminalFactory) === 'undefined') {
                    setTimeout(function(){aux(i+1)}, 250);
                } else {
                    console.log("Scanning Daplug dongles")
                    terminalFactory.list().then(on_success, on_fail)
                }
            }
            aux(0)
        }

        var getSerial = function(on_success, on_fail){
            var command = new ByteString("80E6000000", HEX);
            currentCard.sendApdu(command).then(function(res){
                on_success(res.toString(HEX).substring(0, 20))
            }, on_fail);
        }

        var openCardSC = function(on_success, on_fail){
            var self = this
            var key = new ByteString("404142434445464748494a4b4c4d4e4f", HEX);
            var targetId = 1
            var securityLevel = 35 // CMAC + CDEC + RENC
            var sam = new PlugupSAMSimu();
			secureChannel = new SecureChannelSAM(sam);
			var secureChannelCard = new SecureChannelCard(currentCard, secureChannel);
			secureChannelCard.setKeyset([key, key, key]);
			secureChannelCard.openSession(securityLevel, targetId).then(function(result) {
                console.log("Secure channel opened")
                currentSC = new PlugupV2(secureChannelCard)
                on_success()
            }, on_fail)
        }

        var resetCryptoKey = function(on_success, on_fail) {
            var num = 0x7B
            // TODO: randomize key ...
            var key = new ByteString("505152535455565758595A5B5C5D5E5F", HEX);
            console.log("Generating PUT_KEY")
            secureChannel.getPutKeyAPDU(
                currentSC.card.sessionId, key, num, num,
                undefined, undefined,
                PlugupV2Admin.KEY_ROLE_ENCRYPT_DECRYPT,
                new ByteString("0000", HEX)
            ).then(function(putkeyapdu){
                currentCard.sendApdu(putkeyapdu).then(on_success, on_fail)
            }, on_fail)
        }

        var encrypt = function(data, on_success, on_fail) {
            // TODO: Remove/process non-ASCII characters
            var paddedData = data+" ".repeat(8 - (data.length % 8))
            var fullLen = paddedData.length
            function aux(i, acc){
                if (i > fullLen) {
                    on_success(acc.toString(ASCII))
                    return acc.toString(ASCII)
                } else {
                    var sub = new ByteString(paddedData.substring(i, i+200), ASCII)
                    console.log("SRC: "+sub.length + " " +sub.toString(HEX))
                    return currentSC.encrypt(0x7B, 0x01, false, sub).then(function(res){
                        
                        aux(i+200, acc.concat(res))
                    }, function(e){
                        on_fail(e)
                    }).done()
                }
            }
            return aux(0, new ByteString("", HEX))
        }

        var decrypt = function(data, on_success, on_fail) {
            var fullLen = data.length
            if (fullLen % 8 != 0) {
                on_success(data)
            } else {
                function aux(i, acc){
                    if (i > fullLen) {
                        on_success(acc.toString(ASCII))
                    } else {
                        var sub = new ByteString(data.substring(i, i+200), ASCII)
                        console.log("SRC: "+sub.length + " " +sub.toString(HEX))
                        currentSC.decrypt(0x7B, 0x01, false, sub).then(function(res){
                            
                            aux(i+200, acc.concat(res))
                        }, function(e){
                            on_fail(e)
                        }).done()
                    }
                }
                aux(0, new ByteString("", HEX))
            }
        }

        var test = function(){
            function decOK(res){
                console.log("DECRYPT success")
                console.log("DEC: "+res.length+" "+res)
            }
            function decKO(e){
                console.log("ENCRYPT failed: "+e)
            }
            function encOK(res){
                console.log("ENCRYPT success")
                console.log("ENC: "+res.length + " " +res)
                decrypt(res, decOK, decKO)
            }
            function encKO(e){
                console.log("ENCRYPT failed: "+e)
            }
            function putkeyOK(){
                // console.log("PUT KEY success!")
                var data = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin faucibus ligula at urna adipiscing adipiscing. Nulla eleifend, ante eget sodales sagittis, velit dolor dapibus nunc, interdum aliquam nisl nisl non nisl. Nunc quis enim dapibus, rutrum orci quis, condimentum massa. Pellentesque id pretium odio, a porta ligula. Nunc scelerisque tortor quis varius dapibus. Nullam faucibus quam augue, eget rhoncus enim gravida vestibulum. Fusce sit amet arcu ac nisl pharetra consequat. Etiam nisi enim, malesuada eu purus ut, venenatis dictum nibh. Donec pretium pulvinar tellus sit amet hendrerit. Nulla fringilla erat ipsum, vitae porta lorem venenatis gravida. Mauris gravida feugiat ante.\n\
\n\
Aenean condimentum placerat nunc. In quis nulla suscipit, pulvinar dolor et, adipiscing tortor. Sed feugiat consectetur volutpat. In vel blandit risus, nec eleifend velit. Integer ante dolor, imperdiet ac gravida quis, bibendum in odio. Aenean nec mi leo. Sed eget varius metus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nullam dictum fringilla justo in semper. Ut at magna id mi convallis gravida eget in nisl. Cras pharetra eleifend orci eu euismod. Suspendisse facilisis, quam eget consequat faucibus, nisi libero tincidunt diam, eget mollis magna lorem eu mauris. Curabitur facilisis urna at ornare dapibus.\n\
\n\
Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nulla lobortis mi urna, eget mattis nibh lacinia viverra. Sed ac lacinia lacus. Nulla quam felis, tempus ut tincidunt sit amet, varius blandit nulla. Quisque consectetur nisi in sem vehicula lacinia. Ut commodo tellus vel turpis feugiat varius. Duis aliquam nulla neque, vel lobortis sapien auctor vel. Duis et tempor velit. In commodo, sapien varius tempor egestas, ante massa cursus eros, eget iaculis ipsum ligula nec augue. Mauris ac mauris a felis posuere ultrices. Integer egestas, sapien eu accumsan viverra, velit arcu placerat diam, sit amet tincidunt velit magna convallis eros. Praesent sit amet urna et eros blandit vulputate.\n\
\n\
Fusce nec metus dolor. Donec sit amet ipsum ac lorem venenatis venenatis quis quis magna. Sed non tempus libero. Nulla non arcu ac tortor dictum iaculis. Etiam ultricies ultrices condimentum. Vestibulum eget egestas dolor, eu facilisis tortor. Mauris a fermentum felis. Duis facilisis nulla et quam tincidunt, sed placerat urna elementum. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.\n\
\n\
Aliquam porta ligula vel quam mollis, sit amet pellentesque nunc dictum. Nam convallis velit elit. Vestibulum imperdiet orci magna, sit amet varius sapien iaculis sit amet. Aliquam posuere in mi a eleifend. Ut ut scelerisque nunc, id tempor justo. Vestibulum tincidunt tellus justo, vel dignissim velit tincidunt eget. Integer semper cursus nunc, accumsan lacinia tortor ullamcorper vel. Aliquam et quam quis quam auctor commodo a id eros. Proin vel cursus nibh. Sed ullamcorper sit amet arcu scelerisque ultricies. Suspendisse adipiscing orci sed mauris lacinia ultrices."
                console.log("SRC: "+data.length+" "+data)
                encrypt(data, encOK, encKO)
            }
            function putkeyKO(e){
                console.log("PUT KEY failed: "+e)
            }
            function scOK(){
                resetCryptoKey(putkeyOK, putkeyKO)
            }
            function scKO(e){
                console.log("SC failed: "+e)
            }
            function commOK(sn){
                console.log("s/n: "+sn)
                $("#serial").html(sn)
                openCardSC(scOK, scKO)
                // openCardSC(putkeyOK, scKO)
            }
            function commKO(e){
                console.log("Error exchanging APDU: "+e)
            }
            function initOK(){
                console.log("Init OK")
                getSerial(commOK, commKO);
            }
            function initKO(e){
                console.log("Cannot init card: "+e)
            }
            function scanOK(readers){
                if (readers.length == 0) console.log("No Daplug dongle")
                else if (readers.length == 1) initCard(readers[0], initOK, initKO)
                else console.log("Please use a single Daplug dongle")
            }
            function scanKO(e){
                console.log("Cannot start extension: "+e)
            }
            scan(scanOK, scanKO)
        }

        return {
            scan           : scan,
            initCard       : initCard,
            getSerial      : getSerial,
            openCardSC     : openCardSC,
            resetCryptoKey : resetCryptoKey,
            encrypt        : encrypt,
            decrypt        : decrypt,
            test           : test
        }
    }();

    window.DP = DP

})(window, document);
