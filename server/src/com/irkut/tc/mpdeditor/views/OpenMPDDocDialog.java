package com.irkut.tc.mpdeditor.views;

import java.awt.Desktop;
import java.awt.Dimension;
import java.awt.Frame;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedList;

import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;

import com.irkut.tc.ui.FormLayout;
import com.irkut.tc.util.CheckHelper;
import com.teamcenter.rac.aif.AbstractAIFDialog;
import com.teamcenter.rac.aifrcp.AIFUtility;
import com.teamcenter.rac.kernel.TCComponent;
import com.teamcenter.rac.kernel.TCComponentItem;
import com.teamcenter.rac.kernel.TCException;
import com.teamcenter.rac.kernel.TCSession;
import com.teamcenter.rac.util.Cookie;
import com.teamcenter.rac.util.HorizontalLayout;
import com.teamcenter.rac.util.MessageBox;
import com.teamcenter.rac.util.VerticalLayout;

public class OpenMPDDocDialog extends AbstractAIFDialog {

	protected JLabel uidGenerateLink;

	public OpenMPDDocDialog(final Frame frame, String uid) {
		super(frame);
		initUI(uid);
		setTitle("Test title");

		setMinimumSize(new Dimension(450, 530));
		setSize(600, 500);
		centerToScreen();
	}
	/**
	 *  Создание интерфейса
	 */
	protected void initUI(String uid) {
		getContentPane().setLayout(new VerticalLayout(5, 5, 5, 5, 5));
		JPanel pnl = new JPanel(new VerticalLayout());
		FormLayout fl = new FormLayout(pnl, 3, 2, 0, 5, 5, 0);
		String url = "http://localhost:9090/static/index.html?uid=" + uid;
		
		uidGenerateLink = new JLabel("<href>http://localhost:9090/index.html?uid=" + uid + "</href>");
		
		if (Desktop.isDesktopSupported()) {
            Desktop desktop = Desktop.getDesktop();
            try {
                desktop.browse(new URI(url));
            } catch (IOException | URISyntaxException e) {
                System.err.println("Ошибка при открытии URL: " + e.getMessage());
            }
        } else {
            System.err.println("Desktop не поддерживается на этой платформе.");
        }
//		uidGenerateLink.setText("<href>http://localhost:9090/getdataset?uid=" + uid + "</href>");
		add("top.bind.center.center", uidGenerateLink);

//		final JFileChooser chooser = new JFileChooser();
//		chooser.setDialogTitle(Messages.SelectFolder);
//		chooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
//		JPanel folderSelectionPanel = new JPanel(new HorizontalLayout(5, 0, 0, 0, 0));
//		JButton reviewBtn = new JButton(Messages.OverviewBtnLabel);
//		folderSelectionPanel.add("right.nobind.left", reviewBtn);
//		folderSelectionPanel.add("unbound.nobind.left", pathUidFolder = new JTextField(30));
//		reviewBtn.setPreferredSize(new Dimension(101, 25));
//		loadCookies();
//		reviewBtn.addActionListener(new ActionListener() {
//
//			@Override
//			public void actionPerformed(ActionEvent paramActionEvent) {
//				int result = chooser.showOpenDialog(UIDDialog.this);
//				if (result == JFileChooser.APPROVE_OPTION) {
//					pathUidFolder.setText(chooser.getSelectedFile().getAbsolutePath());
//					setCookies(chooser.getSelectedFile().getAbsolutePath());
//				}
//
//			}
//		});
//
//		fl.addField("Тип фильтрации:", createTypeSelectionPanel());
//		fl.addField("Папка для выгрузки:", folderSelectionPanel);
//
//		add("top.bind.center.center", pnl);
//		add("unbound.bind.center.center", tableUID = new TableUID("Папки"));
//		add("bottom.bind.center.center", createButtons(new JPanel()));
	}

	
}
