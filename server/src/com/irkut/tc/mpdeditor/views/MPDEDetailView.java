package com.irkut.tc.mpdeditor.views;

import java.awt.Frame;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextField;

import org.eclipse.swt.SWT;
import org.eclipse.swt.awt.SWT_AWT;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.ui.part.ViewPart;

public class MPDEDetailView extends ViewPart{
	public static final String ID = "com.irkut.tc.mpdeditor.views.mpdedetailview";

	
	@Override
	public void createPartControl(Composite paramComposite) {
		// TODO Auto-generated method stub
//		paramComposite.setLayout();
		
		Composite CompositeEmb = new Composite(paramComposite, SWT.EMBEDDED);
		
		Frame frame = SWT_AWT.new_Frame(CompositeEmb);
		
		frame.setLayout(new BoxLayout(frame, BoxLayout.X_AXIS));
		
		MPDEDynamicForm form = new MPDEDynamicForm();
		
		frame.add(form);
//		frame.add(form);
		
		
	}

	@Override
	public void setFocus() {
		// TODO Auto-generated method stub
		
	}
}
