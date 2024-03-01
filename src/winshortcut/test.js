const winshortcut = require('./build/Release/winshortcut');

winshortcut.setProps("C:\\work\\a.mp4", {
	"year" : 1991,
	"artists" : ["a", "b", "c"],
	"tags" : ["t1", "t2", "t3"],
//	"genre" : ["g", "t2", "t3"],
//	"title" : "タイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaタイトルaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	"title" : 'PRED-389 メモリアルヌードを撮るだけのはずが…カメラマンに心も股間も濡らされ、中出しまで許してしまったワタシ… 希島あいり',
	"subTitle" : "Subタイトル",
	"comment" : "※"
});
console.log( "getPrp:", winshortcut.getProps("C:\\work\\a.mp4")  );
console.log( "getPrp:", winshortcut.getProps("C:\\work\\whatsup.m4a")  );
console.log( "getPrp:", winshortcut.getProps("C:\\work\\a.jpg")  );




//console.log( winshortcut.getAbsoltePath("C:\\work\\テスト.lnk") );
//console.log( winshortcut.getAbsoltePath("C:\\work\\a.lnk") );
//winshortcut.setAbsoltePath("C:\\work\\a.lnk", "C:\\work\\out.txt");

//winshortcut.dumpPropertyStore("C:\\work\\whatsup.m4a");
winshortcut.openShellProperty("C:\\work\\whatsup.m4a");
