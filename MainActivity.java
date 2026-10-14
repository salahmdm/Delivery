package fr.gestion.livreurs;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.ViewGroup;
public class MainActivity extends Activity {
 @Override public void onCreate(Bundle savedInstanceState) {
  super.onCreate(savedInstanceState);
  WebView web = new WebView(this);
  web.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
  WebSettings settings = web.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  web.setWebViewClient(new WebViewClient());
  setContentView(web);
  web.loadUrl("file:///android_asset/index.html");
 }
}
