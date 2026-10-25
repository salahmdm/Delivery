package fr.journaux.app;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        final View web = getBridge().getWebView();
        // Le clavier réduit la zone de l'application au lieu de la recouvrir.
        ViewCompat.setOnApplyWindowInsetsListener(web, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            lp.leftMargin = bars.left;
            lp.topMargin = bars.top;
            lp.rightMargin = bars.right;
            lp.bottomMargin = Math.max(bars.bottom, ime.bottom);
            v.setLayoutParams(lp);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(web);
    }
}
