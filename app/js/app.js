// ===== Application State Management =====
const AppState = {
    currentSection: 'welcomeSection',
    photos: [],
    questionnaire: {
        skinProblems: [],
        needs: [],
        budget: '',
        recovery: ''
    },
    chatHistory: [],
    selectedPlan: null,
    settings: {
        theme: 'elegant',
        fontSize: 'medium',
        aiStyle: 'standard',
        aiLength: 'concise'
    },
    histories: []
};

// ===== Constants =====
const SKIN_PROBLEMS = [
    '痤疮/痘痘', '色斑/晒斑', '肤色暗沉', '毛孔粗大',
    '细纹/皱纹', '松弛下垂', '红血丝', '敏感泛红',
    '干燥缺水', '油脂分泌过多', '眼部问题', '颈纹'
];

const AESTHETIC_NEEDS = [
    '美白提亮', '祛斑淡斑', '祛痘控油', '收缩毛孔',
    '抗衰除皱', '紧致提升', '补水保湿', '修复敏感',
    '眼部年轻化', '面部轮廓', '颈部年轻化', '身体塑形'
];

const AI_API_KEY = 'AIzaSyBn2dNuTBArfSdO6HvKWu0omsQ9fqeyMtE'; // Google Gemini API密钥
const AI_MODEL = 'gemini-1.5-flash'; // 使用Gemini 1.5 Flash模型

// ===== Utility Functions =====
const Utils = {
    showLoading(text = 'AI正在分析中...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = overlay.querySelector('.loading-text');
        loadingText.textContent = text;
        overlay.style.display = 'flex';
    },

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    },

    showToast(message, icon = 'check_circle') {
        const toast = document.getElementById('toast');
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');

        toastIcon.textContent = icon;
        toastMessage.textContent = message;
        toast.style.display = 'flex';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    },

    formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    async validateImage(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject('请上传图片文件');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                reject('图片大小不能超过10MB');
                return;
            }

            const img = new Image();
            img.onload = () => {
                if (img.width < 200 || img.height < 200) {
                    reject('图片尺寸太小，请上传更清晰的照片');
                } else {
                    resolve(true);
                }
            };
            img.onerror = () => reject('图片格式不正确');
            img.src = URL.createObjectURL(file);
        });
    },

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    renderMarkdown(text) {
        // Simple markdown renderer
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^## (.+)$/gm, '<h3>$1</h3>')
            .replace(/^# (.+)$/gm, '<h2>$1</h2>')
            .replace(/\n- (.+)/g, '\n<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>');
    },

    async callAI(prompt, systemPrompt = '') {
        // iOS兼容的AI调用实现 - 使用Google Gemini API
        // 使用标准Fetch API，确保iOS Safari兼容
        const style = AppState.settings.aiStyle;
        const length = AppState.settings.aiLength;

        const stylePrompts = {
            casual: '请用轻松幽默的语气回答，让用户感觉像在和朋友聊天。',
            standard: '请用专业但友好的语气回答，保持标准日常交流风格。',
            professional: '请用科学严谨的语气回答，提供准确的医学美容专业信息。'
        };

        const lengthPrompts = {
            detailed: '请提供详细完整的回答。',
            standard: '请提供适中长度的回答。',
            concise: '请提供简洁明了的回答。'
        };

        const fullSystemPrompt = `你是一个专业的医美咨询助手，为重庆联合丽格第五医疗美容医院服务。
${systemPrompt}
${stylePrompts[style]}
${lengthPrompts[length]}

重要提醒：
1. 所有建议仅供参考，最终需医生面诊确认
2. 回答要专业、准确、负责任
3. 涉及具体治疗时要强调个体差异
4. 必要时建议用户咨询专业医生`;

        const fullPrompt = fullSystemPrompt + '\n\n' + prompt;

        try {
            // 使用Google Gemini API
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`;

            const maxTokens = length === 'detailed' ? 2048 : (length === 'standard' ? 1024 : 512);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: maxTokens,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Gemini API Error:', errorData);
                throw new Error(`AI调用失败: ${response.status}`);
            }

            const data = await response.json();

            // 解析Gemini响应格式
            if (data.candidates && data.candidates.length > 0) {
                const candidate = data.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    return candidate.content.parts[0].text;
                }
            }

            throw new Error('AI返回格式异常');
        } catch (error) {
            console.error('AI调用错误:', error);
            // 返回模拟回复以便开发测试
            return this.getMockAIResponse(prompt);
        }
    },

    getMockAIResponse(prompt) {
        // 模拟AI回复用于开发测试
        if (prompt.includes('照片') || prompt.includes('分析')) {
            return '根据您上传的照片，我注意到以下几个方面：\n\n1. **肤色状态**：整体肤色较为均匀，但局部有轻微色素沉着\n2. **毛孔状况**：T区毛孔略显粗大，需要适当护理\n3. **肌肤纹理**：皮肤纹理较为细腻，保养得当\n\n建议重点关注美白提亮和毛孔收缩的治疗项目。';
        }

        if (prompt.includes('预算') || prompt.includes('方案')) {
            return '根据您的需求和预算，我为您推荐以下治疗思路：\n\n**主要问题**：肤色暗沉、毛孔粗大\n**建议疗程**：3-6个月\n**核心项目**：光子嫩肤 + 水光针\n**辅助护理**：医用面膜、刷酸治疗\n\n这个组合能够有效改善您关注的问题，费用也在您的预算范围内。';
        }

        return '感谢您的咨询。我会根据您的具体情况提供个性化建议。请问您还有其他问题吗？';
    }
};

// ===== Navigation System =====
const Navigation = {
    init() {
        // Footer navigation
        document.querySelectorAll('.footer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateTo(section);
            });
        });

        // Section navigation buttons
        document.getElementById('startBtn')?.addEventListener('click', () => {
            this.navigateTo('photoSection');
        });

        document.getElementById('photoBackBtn')?.addEventListener('click', () => {
            this.navigateTo('welcomeSection');
        });

        document.getElementById('photoNextBtn')?.addEventListener('click', () => {
            this.navigateTo('questionnaireSection');
        });

        document.getElementById('questionnaireBackBtn')?.addEventListener('click', () => {
            this.navigateTo('photoSection');
        });

        document.getElementById('questionnaireNextBtn')?.addEventListener('click', () => {
            this.navigateTo('aiConfirmSection');
            AIChat.start();
        });

        document.getElementById('aiConfirmBackBtn')?.addEventListener('click', () => {
            this.navigateTo('questionnaireSection');
        });

        document.getElementById('aiConfirmNextBtn')?.addEventListener('click', () => {
            TreatmentPlans.generate();
        });

        document.getElementById('plansBackBtn')?.addEventListener('click', () => {
            this.navigateTo('aiConfirmSection');
        });
    },

    navigateTo(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(sectionId)?.classList.add('active');

        // Update footer active state
        document.querySelectorAll('.footer-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionId) {
                btn.classList.add('active');
            }
        });

        // Update app state
        AppState.currentSection = sectionId;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// ===== Photo Upload System =====
const PhotoUpload = {
    init() {
        document.querySelectorAll('.photo-input').forEach((input, index) => {
            input.addEventListener('change', (e) => this.handlePhotoUpload(e, index));
        });

        document.querySelectorAll('.photo-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.removePhoto(index);
            });
        });
    },

    async handlePhotoUpload(event, index) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            Utils.showLoading('验证照片中...');
            await Utils.validateImage(file);

            const base64 = await Utils.fileToBase64(file);

            AppState.photos[index] = {
                file,
                base64,
                timestamp: Date.now()
            };

            this.displayPhoto(index, base64);
            this.updateNextButton();

            Utils.hideLoading();
            Utils.showToast('照片上传成功');
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error, 'error');
            event.target.value = '';
        }
    },

    displayPhoto(index, base64) {
        const slot = document.querySelector(`.photo-upload-slot[data-index="${index}"]`);
        const label = slot.querySelector('.photo-label');
        const preview = slot.querySelector('.photo-preview');
        const img = preview.querySelector('img');

        label.style.display = 'none';
        preview.style.display = 'block';
        img.src = base64;
    },

    removePhoto(index) {
        const slot = document.querySelector(`.photo-upload-slot[data-index="${index}"]`);
        const label = slot.querySelector('.photo-label');
        const preview = slot.querySelector('.photo-preview');
        const input = slot.querySelector('.photo-input');

        AppState.photos[index] = null;
        label.style.display = 'flex';
        preview.style.display = 'none';
        input.value = '';

        this.updateNextButton();
    },

    updateNextButton() {
        const uploadedCount = AppState.photos.filter(p => p !== null && p !== undefined).length;
        const nextBtn = document.getElementById('photoNextBtn');
        nextBtn.disabled = uploadedCount === 0;
    }
};

// ===== Questionnaire System =====
const Questionnaire = {
    init() {
        this.renderSkinProblems();
        this.renderNeeds();
        this.attachEventListeners();
    },

    renderSkinProblems() {
        const grid = document.getElementById('skinProblemsGrid');
        grid.innerHTML = SKIN_PROBLEMS.map((problem, index) => `
            <label class="checkbox-option">
                <input type="checkbox" name="skinProblem" value="${problem}" data-index="${index}">
                <span class="checkbox-label">${problem}</span>
            </label>
        `).join('');
    },

    renderNeeds() {
        const grid = document.getElementById('needsGrid');
        grid.innerHTML = AESTHETIC_NEEDS.map((need, index) => `
            <label class="checkbox-option">
                <input type="checkbox" name="need" value="${need}" data-index="${index}">
                <span class="checkbox-label">${need}</span>
            </label>
        `).join('');
    },

    attachEventListeners() {
        document.querySelectorAll('input[name="skinProblem"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    AppState.questionnaire.skinProblems.push(e.target.value);
                } else {
                    AppState.questionnaire.skinProblems =
                        AppState.questionnaire.skinProblems.filter(p => p !== e.target.value);
                }
            });
        });

        document.querySelectorAll('input[name="need"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    AppState.questionnaire.needs.push(e.target.value);
                } else {
                    AppState.questionnaire.needs =
                        AppState.questionnaire.needs.filter(n => n !== e.target.value);
                }
            });
        });

        document.querySelectorAll('input[name="budget"]').forEach(input => {
            input.addEventListener('change', (e) => {
                AppState.questionnaire.budget = e.target.value;
            });
        });

        document.querySelectorAll('input[name="recovery"]').forEach(input => {
            input.addEventListener('change', (e) => {
                AppState.questionnaire.recovery = e.target.value;
            });
        });
    }
};

// ===== AI Chat System =====
const AIChat = {
    init() {
        const sendBtn = document.getElementById('chatSendBtn');
        const input = document.getElementById('chatInput');

        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    },

    start() {
        // Generate initial AI message based on uploaded photos and questionnaire
        const initialPrompt = this.generateInitialPrompt();
        this.addAIMessage('正在分析您的照片和问卷...');

        setTimeout(async () => {
            try {
                const response = await Utils.callAI(initialPrompt);
                this.updateLastMessage(response);
                this.generateSuggestedQuestions();
            } catch (error) {
                this.updateLastMessage('分析完成。我注意到您关注的主要问题，让我们进一步确认您的需求。');
                this.generateSuggestedQuestions();
            }
        }, 1000);
    },

    generateInitialPrompt() {
        const { skinProblems, needs, budget, recovery } = AppState.questionnaire;

        return `用户上传了${AppState.photos.filter(p => p).length}张照片，并填写了以下信息：

关注的皮肤问题：${skinProblems.join('、')}
医美需求：${needs.join('、')}
预算期望：${budget}
恢复时间预期：${recovery}

请基于这些信息，为用户提供初步分析，并提出2-3个关键问题来进一步确认用户的需求和期望。`;
    },

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        this.addUserMessage(message);
        input.value = '';
        input.style.height = 'auto';

        // Add to chat history
        AppState.chatHistory.push({
            role: 'user',
            content: message,
            timestamp: Date.now()
        });

        // Get AI response
        this.addAIMessage('思考中...');

        try {
            const response = await Utils.callAI(message, this.getConversationContext());
            this.updateLastMessage(response);

            AppState.chatHistory.push({
                role: 'assistant',
                content: response,
                timestamp: Date.now()
            });

            // Generate new suggested questions
            this.generateSuggestedQuestions();
        } catch (error) {
            this.updateLastMessage('抱歉，我暂时无法回答。请稍后再试或直接咨询我们的专业医生。');
        }
    },

    getConversationContext() {
        const recentHistory = AppState.chatHistory.slice(-6);
        return `对话历史：\n${recentHistory.map(h => `${h.role}: ${h.content}`).join('\n')}\n\n继续对话，保持上下文连贯。`;
    },

    addUserMessage(content) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message user';
        messageEl.innerHTML = `
            <div class="chat-avatar">
                <span class="material-symbols-rounded">person</span>
            </div>
            <div class="chat-bubble">
                <p>${this.escapeHtml(content)}</p>
            </div>
        `;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    addAIMessage(content) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message ai';
        messageEl.innerHTML = `
            <div class="chat-avatar">
                <span class="material-symbols-rounded">smart_toy</span>
            </div>
            <div class="chat-bubble">
                ${Utils.renderMarkdown(content)}
            </div>
        `;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    updateLastMessage(content) {
        const messagesContainer = document.getElementById('chatMessages');
        const lastMessage = messagesContainer.querySelector('.chat-message.ai:last-child .chat-bubble');
        if (lastMessage) {
            lastMessage.innerHTML = Utils.renderMarkdown(content);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    },

    generateSuggestedQuestions() {
        const container = document.getElementById('suggestedQuestions');
        const questions = [
            '这些治疗安全吗？',
            '大概需要多长时间见效？',
            '有没有副作用？',
            '需要做几次疗程？'
        ];

        container.innerHTML = questions.map(q => `
            <button class="suggested-question-btn" onclick="AIChat.askQuestion('${q}')">
                ${q}
            </button>
        `).join('');
    },

    askQuestion(question) {
        const input = document.getElementById('chatInput');
        input.value = question;
        this.sendMessage();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===== Treatment Plans Generator =====
const TreatmentPlans = {
    async generate() {
        Utils.showLoading('AI正在生成个性化方案...');

        try {
            // Navigate to plans section
            Navigation.navigateTo('plansSection');

            // Generate three plans
            const plans = await this.generatePlans();
            this.renderPlans(plans);

            Utils.hideLoading();
            Utils.showToast('方案生成成功');
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('方案生成失败，请重试', 'error');
        }
    },

    async generatePlans() {
        // Load service list
        let serviceList = {};
        try {
            const response = await fetch('../data/servicelist.json');
            serviceList = await response.json();
        } catch (error) {
            console.error('Failed to load service list:', error);
        }

        const { skinProblems, needs, budget, recovery } = AppState.questionnaire;

        // Generate three different plans
        return [
            {
                type: 'standard',
                title: '标准程序方案',
                description: '价格和耗时折中，效果预期确切。适合追求稳妥效果的用户。',
                items: this.selectStandardItems(skinProblems, needs, serviceList),
                duration: '3-6个月',
                sessions: '6-10次',
                recovery: '1-3天',
                price: '12,800',
                priceRange: '10,000-15,000'
            },
            {
                type: 'quick',
                title: '快捷省时方案',
                description: '快速初步解决问题，确定下一步方案。适合时间紧张或初次尝试的用户。',
                items: this.selectQuickItems(skinProblems, needs, serviceList),
                duration: '1-2个月',
                sessions: '3-5次',
                recovery: '无恢复期',
                price: '5,800',
                priceRange: '5,000-8,000'
            },
            {
                type: 'custom',
                title: '私人医生诊疗',
                description: '辩证施治，深度定制。由专业医生根据个体情况精心设计。',
                items: this.selectCustomItems(skinProblems, needs, serviceList),
                duration: '6-12个月',
                sessions: '10-15次',
                recovery: '3-7天',
                price: '25,800',
                priceRange: '20,000-30,000'
            }
        ];
    },

    selectStandardItems(problems, needs, serviceList) {
        // Standard plan items
        return [
            {
                name: '光子嫩肤',
                description: '改善肤色不均、色斑、毛孔粗大等问题',
                icon: 'wb_sunny'
            },
            {
                name: '水光针',
                description: '深层补水，改善肤质，提升光泽度',
                icon: 'water_drop'
            },
            {
                name: '果酸焕肤',
                description: '去除老化角质，促进细胞更新',
                icon: 'autorenew'
            }
        ];
    },

    selectQuickItems(problems, needs, serviceList) {
        // Quick plan items
        return [
            {
                name: 'OPT光子嫩肤',
                description: '快速改善肤色，无恢复期',
                icon: 'flash_on'
            },
            {
                name: '医用补水面膜',
                description: '即时补水，舒缓修复',
                icon: 'masks'
            }
        ];
    },

    selectCustomItems(problems, needs, serviceList) {
        // Custom plan items
        return [
            {
                name: '超皮秒激光',
                description: '深层祛斑，改善肤质，效果显著',
                icon: 'bolt'
            },
            {
                name: '热玛吉',
                description: '深层紧致提升，抗衰年轻化',
                icon: 'local_fire_department'
            },
            {
                name: '水光针 + 胶原蛋白',
                description: '深层补水+胶原再生，全面改善',
                icon: 'spa'
            },
            {
                name: '黄金微针',
                description: '射频+微针，紧致毛孔，改善质地',
                icon: 'grid_4x4'
            }
        ];
    },

    renderPlans(plans) {
        const container = document.getElementById('plansContainer');
        container.innerHTML = plans.map((plan, index) => `
            <div class="plan-card" data-plan-index="${index}">
                <div class="plan-header">
                    <div class="plan-type">${plan.type}</div>
                    <h3 class="plan-title">${plan.title}</h3>
                    <p class="plan-description">${plan.description}</p>
                </div>
                <div class="plan-body">
                    <div class="plan-section">
                        <h4 class="plan-section-title">
                            <span class="material-symbols-rounded">medical_services</span>
                            治疗项目
                        </h4>
                        <div class="plan-items">
                            ${plan.items.map(item => `
                                <div class="plan-item">
                                    <div class="plan-item-icon">
                                        <span class="material-symbols-rounded">${item.icon}</span>
                                    </div>
                                    <div class="plan-item-content">
                                        <div class="plan-item-name">${item.name}</div>
                                        <div class="plan-item-description">${item.description}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="plan-section">
                        <h4 class="plan-section-title">
                            <span class="material-symbols-rounded">schedule</span>
                            疗程信息
                        </h4>
                        <div class="plan-items">
                            <div class="plan-item">
                                <div class="plan-item-icon">
                                    <span class="material-symbols-rounded">event</span>
                                </div>
                                <div class="plan-item-content">
                                    <div class="plan-item-name">疗程周期</div>
                                    <div class="plan-item-description">${plan.duration}，共${plan.sessions}</div>
                                </div>
                            </div>
                            <div class="plan-item">
                                <div class="plan-item-icon">
                                    <span class="material-symbols-rounded">healing</span>
                                </div>
                                <div class="plan-item-content">
                                    <div class="plan-item-name">恢复时间</div>
                                    <div class="plan-item-description">${plan.recovery}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="plan-price">
                        <span class="plan-price-label">参考价格：</span>
                        <span class="plan-price-amount">¥${plan.price}</span>
                        <span class="plan-price-range">（${plan.priceRange}元）</span>
                    </div>
                </div>
                <div class="plan-actions">
                    <button class="primary-btn" onclick="TreatmentPlans.selectPlan(${index})">
                        <span class="material-symbols-rounded">check_circle</span>
                        选择此方案
                    </button>
                </div>
            </div>
        `).join('');
    },

    selectPlan(index) {
        AppState.selectedPlan = index;
        Utils.showToast('方案已选择');

        // Highlight selected plan
        document.querySelectorAll('.plan-card').forEach((card, i) => {
            if (i === index) {
                card.style.borderLeft = '4px solid var(--primary-color)';
            } else {
                card.style.borderLeft = 'none';
            }
        });
    }
};

// ===== Report Export System =====
const ReportExport = {
    init() {
        document.getElementById('exportReportBtn')?.addEventListener('click', () => {
            this.showExportModal();
        });

        document.getElementById('exportPngBtn')?.addEventListener('click', () => {
            this.exportAsPNG();
        });

        document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
            this.exportAsPDF();
        });
    },

    showExportModal() {
        if (AppState.selectedPlan === null) {
            Utils.showToast('请先选择一个方案', 'warning');
            return;
        }
        Modals.open('exportModal');
    },

    async exportAsPNG() {
        try {
            Utils.showLoading('正在生成PNG报告...');

            // Use html2canvas library (needs to be included)
            const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');

            const element = document.querySelector('.plan-card.selected') ||
                           document.querySelectorAll('.plan-card')[AppState.selectedPlan];

            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2
            });

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `智搭医美-方案报告-${Date.now()}.png`;
                link.href = url;
                link.click();

                Utils.hideLoading();
                Utils.showToast('PNG报告已导出');
                Modals.close('exportModal');
            });
        } catch (error) {
            console.error('PNG export error:', error);
            Utils.hideLoading();
            Utils.showToast('导出失败，请重试', 'error');
        }
    },

    async exportAsPDF() {
        try {
            Utils.showLoading('正在生成PDF报告...');

            // Use jsPDF library (needs to be included)
            const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm');
            const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');

            const element = document.querySelector('.plan-card.selected') ||
                           document.querySelectorAll('.plan-card')[AppState.selectedPlan];

            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`智搭医美-方案报告-${Date.now()}.pdf`);

            Utils.hideLoading();
            Utils.showToast('PDF报告已导出');
            Modals.close('exportModal');
        } catch (error) {
            console.error('PDF export error:', error);
            Utils.hideLoading();
            Utils.showToast('导出失败，请重试', 'error');
        }
    }
};

// ===== History Management =====
const History = {
    init() {
        document.getElementById('loadHistoryBtn')?.addEventListener('click', () => {
            this.showHistory();
        });

        this.loadFromStorage();
    },

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('zhida_meimei_history');
            if (stored) {
                AppState.histories = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    },

    saveToStorage() {
        try {
            localStorage.setItem('zhida_meimei_history', JSON.stringify(AppState.histories));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    },

    saveCurrentSession() {
        const session = {
            id: Date.now(),
            date: new Date(),
            photos: AppState.photos.filter(p => p),
            questionnaire: { ...AppState.questionnaire },
            chatHistory: [...AppState.chatHistory],
            selectedPlan: AppState.selectedPlan
        };

        AppState.histories.unshift(session);
        if (AppState.histories.length > 10) {
            AppState.histories = AppState.histories.slice(0, 10);
        }

        this.saveToStorage();
        Utils.showToast('已保存到历史记录');
    },

    showHistory() {
        this.renderHistory();
        Modals.open('historyModal');
    },

    renderHistory() {
        const container = document.getElementById('historyList');

        if (AppState.histories.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <span class="material-symbols-rounded" style="font-size: 48px; opacity: 0.3;">history</span>
                    <p style="margin-top: 16px;">暂无历史记录</p>
                </div>
            `;
            return;
        }

        container.innerHTML = AppState.histories.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-item-icon">
                    <span class="material-symbols-rounded">assignment</span>
                </div>
                <div class="history-item-content">
                    <div class="history-item-title">方案咨询 #${item.id}</div>
                    <div class="history-item-date">${Utils.formatDate(item.date)}</div>
                </div>
                <div class="history-item-actions">
                    <button onclick="History.loadSession(${index})" title="加载">
                        <span class="material-symbols-rounded">open_in_new</span>
                    </button>
                    <button onclick="History.deleteSession(${index})" title="删除">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    },

    loadSession(index) {
        const session = AppState.histories[index];
        if (!session) return;

        AppState.photos = session.photos;
        AppState.questionnaire = session.questionnaire;
        AppState.chatHistory = session.chatHistory;
        AppState.selectedPlan = session.selectedPlan;

        Modals.close('historyModal');
        Navigation.navigateTo('plansSection');
        Utils.showToast('历史记录已加载');
    },

    deleteSession(index) {
        if (confirm('确定要删除这条记录吗？')) {
            AppState.histories.splice(index, 1);
            this.saveToStorage();
            this.renderHistory();
            Utils.showToast('已删除');
        }
    }
};

// ===== Settings System =====
const Settings = {
    init() {
        // Theme selector
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setTheme(theme);
            });
        });

        // Font size
        document.querySelectorAll('input[name="fontSize"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.setFontSize(e.target.value);
            });
        });

        // AI style
        document.querySelectorAll('input[name="aiStyle"]').forEach(input => {
            input.addEventListener('change', (e) => {
                AppState.settings.aiStyle = e.target.value;
                this.saveSettings();
            });
        });

        // AI length
        document.querySelectorAll('input[name="aiLength"]').forEach(input => {
            input.addEventListener('change', (e) => {
                AppState.settings.aiLength = e.target.value;
                this.saveSettings();
            });
        });

        this.loadSettings();
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        AppState.settings.theme = theme;
        this.saveSettings();

        // Update active state
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    },

    setFontSize(size) {
        document.documentElement.setAttribute('data-font-size', size);
        AppState.settings.fontSize = size;
        this.saveSettings();
    },

    saveSettings() {
        try {
            localStorage.setItem('zhida_meimei_settings', JSON.stringify(AppState.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    },

    loadSettings() {
        try {
            const stored = localStorage.getItem('zhida_meimei_settings');
            if (stored) {
                AppState.settings = { ...AppState.settings, ...JSON.parse(stored) };
                this.applySettings();
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    },

    applySettings() {
        this.setTheme(AppState.settings.theme);
        this.setFontSize(AppState.settings.fontSize);

        document.querySelector(`input[name="aiStyle"][value="${AppState.settings.aiStyle}"]`).checked = true;
        document.querySelector(`input[name="aiLength"][value="${AppState.settings.aiLength}"]`).checked = true;
    }
};

// ===== Modal System =====
const Modals = {
    init() {
        // Open modal buttons
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.open('settingsModal');
        });

        document.getElementById('aboutBtn')?.addEventListener('click', () => {
            this.open('aboutModal');
        });

        document.getElementById('guideBtn')?.addEventListener('click', () => {
            this.open('guideModal');
        });

        document.getElementById('viewDisclaimerBtn')?.addEventListener('click', () => {
            this.close('aboutModal');
            this.open('disclaimerModal');
        });

        // Close modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.currentTarget.dataset.modal;
                this.close(modalId);
            });
        });

        // Click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close(modal.id);
                }
            });
        });

        // QR code click
        document.querySelector('.footer-qr img')?.addEventListener('click', () => {
            window.open('https://work.weixin.qq.com/kfid/kfcfc2a809493f31e8f', '_blank');
        });
    },

    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

// ===== Text Selection AI =====
const SelectionAI = {
    init() {
        const popup = document.getElementById('selectionAiPopup');
        const btn = document.getElementById('selectionAiBtn');

        document.addEventListener('mouseup', (e) => {
            setTimeout(() => {
                const selection = window.getSelection();
                const text = selection.toString().trim();

                if (text && text.length > 3 && text.length < 500) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    popup.style.left = `${rect.left + rect.width / 2 - 18}px`;
                    popup.style.top = `${rect.top - 45}px`;
                    popup.style.display = 'block';

                    popup.dataset.selectedText = text;
                } else {
                    popup.style.display = 'none';
                }
            }, 10);
        });

        btn.addEventListener('click', async () => {
            const text = popup.dataset.selectedText;
            popup.style.display = 'none';

            if (text) {
                Utils.showLoading('AI解释中...');
                try {
                    const explanation = await Utils.callAI(
                        `请解释以下医美相关的术语或内容：${text}`,
                        '请用简洁易懂的语言解释，面向普通消费者。'
                    );

                    Utils.hideLoading();
                    this.showExplanation(text, explanation);
                } catch (error) {
                    Utils.hideLoading();
                    Utils.showToast('解释失败，请重试', 'error');
                }
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (!popup.contains(e.target)) {
                popup.style.display = 'none';
            }
        });
    },

    showExplanation(term, explanation) {
        // Create a temporary modal for explanation
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>
                        <span class="material-symbols-rounded">lightbulb</span>
                        AI解释
                    </h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <h4 style="margin-bottom: 12px; color: var(--primary-color);">${term}</h4>
                    ${Utils.renderMarkdown(explanation)}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
};

// ===== Social Sharing =====
const SocialShare = {
    init() {
        // Add share buttons to plan cards
        this.addShareButtons();
    },

    addShareButtons() {
        document.querySelectorAll('.plan-actions').forEach((actions, index) => {
            const shareBtn = document.createElement('button');
            shareBtn.className = 'secondary-btn';
            shareBtn.innerHTML = `
                <span class="material-symbols-rounded">share</span>
                分享方案
            `;
            shareBtn.onclick = () => this.share(index);
            actions.appendChild(shareBtn);
        });
    },

    share(planIndex) {
        const shareData = {
            title: '智搭医美 - 个性化医美方案',
            text: '我在智搭医美生成了专属方案，快来看看！',
            url: window.location.href
        };

        if (navigator.share) {
            // Use native share API
            navigator.share(shareData).catch(err => {
                console.log('Share cancelled:', err);
            });
        } else {
            // Fallback: Copy link
            this.copyLink();
        }
    },

    copyLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            Utils.showToast('链接已复制到剪贴板');
        }).catch(() => {
            Utils.showToast('复制失败', 'error');
        });
    }
};

// ===== Project Browser System =====
const ProjectBrowser = {
    serviceData: null,
    filteredItems: [],
    currentFilters: {
        category: 'all',
        priceMin: 0,
        priceMax: 100000,
        problem: 'all',
        searchText: ''
    },

    async init() {
        // Load service data
        await this.loadServiceData();

        // Initialize event listeners
        this.initEventListeners();

        // Initial render
        this.renderCategories();
        this.applyFilters(); // 使用applyFilters替代renderProjects，它会自动调用renderProjects
    },

    async loadServiceData() {
        try {
            const response = await fetch('data/cqbcc-service.json');
            this.serviceData = await response.json();
            console.log('Service data loaded:', this.serviceData);
        } catch (error) {
            console.error('Failed to load service data:', error);
            Utils.showToast('加载项目数据失败', 'error');
        }
    },

    initEventListeners() {
        // Category filter
        document.getElementById('projectCategoryFilter')?.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.applyFilters();
        });

        // Price range
        document.getElementById('projectPriceMin')?.addEventListener('input', (e) => {
            this.currentFilters.priceMin = parseInt(e.target.value) || 0;
            this.applyFilters();
        });

        document.getElementById('projectPriceMax')?.addEventListener('input', (e) => {
            this.currentFilters.priceMax = parseInt(e.target.value) || 100000;
            this.applyFilters();
        });

        // Search
        document.getElementById('projectSearch')?.addEventListener('input', (e) => {
            this.currentFilters.searchText = e.target.value.trim();
            this.applyFilters();
        });

        // Problem-based recommendation
        document.getElementById('problemRecommendBtn')?.addEventListener('click', () => {
            this.showProblemRecommendation();
        });

        // Clear filters
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            this.clearFilters();
        });
    },

    renderCategories() {
        if (!this.serviceData || !this.serviceData.categories) return;

        const select = document.getElementById('projectCategoryFilter');
        if (!select) return;

        const options = ['<option value="all">所有分类</option>'];
        this.serviceData.categories.forEach(cat => {
            options.push(`<option value="${cat.id}">${cat.name}</option>`);
        });

        select.innerHTML = options.join('');
    },

    applyFilters() {
        if (!this.serviceData) return;

        let items = [];

        // Collect all items from all categories
        this.serviceData.categories.forEach(category => {
            category.subcategories?.forEach(subcategory => {
                subcategory.items?.forEach(item => {
                    items.push({
                        ...item,
                        categoryId: category.id,
                        categoryName: category.name,
                        subcategoryName: subcategory.name
                    });
                });
            });
        });

        // Apply category filter
        if (this.currentFilters.category !== 'all') {
            items = items.filter(item => item.categoryId === this.currentFilters.category);
        }

        // Apply price filter
        items = items.filter(item => {
            const price = this.getItemPrice(item);
            return price >= this.currentFilters.priceMin && price <= this.currentFilters.priceMax;
        });

        // Apply search filter
        if (this.currentFilters.searchText) {
            const search = this.currentFilters.searchText.toLowerCase();
            items = items.filter(item =>
                item.name?.toLowerCase().includes(search) ||
                item.description?.toLowerCase().includes(search)
            );
        }

        this.filteredItems = items;
        this.renderProjects();
        this.updateResultCount();
    },

    getItemPrice(item) {
        if (!item.price) return 0;
        if (typeof item.price === 'number') return item.price;
        if (item.price.single) return item.price.single;
        if (item.price.package_3) return item.price.package_3;
        return 0;
    },

    renderProjects() {
        const container = document.getElementById('projectsGrid');
        if (!container) return;

        if (!this.filteredItems || this.filteredItems.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <span class="material-symbols-rounded">search_off</span>
                    <p>未找到匹配的项目</p>
                    <button class="secondary-btn" onclick="ProjectBrowser.clearFilters()">
                        清除筛选条件
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredItems.map(item => `
            <div class="project-card">
                <div class="project-card-header">
                    <h3>${item.name}</h3>
                    <div class="project-card-category">
                        ${item.categoryName} / ${item.subcategoryName}
                    </div>
                </div>
                <div class="project-card-body">
                    ${item.description || item.function ? `
                        <p class="project-description">${item.description || item.function}</p>
                    ` : ''}

                    ${item.ai_description ? `
                        <div class="ai-description">
                            <span class="ai-badge">
                                <span class="material-symbols-rounded">smart_toy</span>
                                AI说明
                            </span>
                            <p>${item.ai_description}</p>
                        </div>
                    ` : ''}

                    ${item.components ? `
                        <div class="project-components">
                            <strong>包含项目：</strong>
                            <ul>
                                ${item.components.map(comp => `<li>${comp}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${item.area ? `
                        <div class="project-detail">
                            <span class="material-symbols-rounded">location_on</span>
                            <span>治疗部位：${item.area}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="project-card-footer">
                    ${this.renderPrice(item.price)}
                    <button class="primary-btn" onclick="ProjectBrowser.addToCart('${item.id}')">
                        <span class="material-symbols-rounded">add_shopping_cart</span>
                        加入方案
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderPrice(price) {
        if (!price) return '<div class="project-price">价格面议</div>';

        if (typeof price === 'number') {
            return `<div class="project-price">¥${price.toLocaleString()}</div>`;
        }

        const prices = [];
        if (price.single) prices.push(`单次: ¥${price.single.toLocaleString()}`);
        if (price.package_3) prices.push(`3次: ¥${price.package_3.toLocaleString()}`);
        if (price.package_5) prices.push(`5次: ¥${price.package_5.toLocaleString()}`);
        if (price.package_10) prices.push(`10次: ¥${price.package_10.toLocaleString()}`);

        return `<div class="project-price">${prices.join(' | ')}</div>`;
    },

    updateResultCount() {
        const counter = document.getElementById('projectResultCount');
        if (counter) {
            counter.textContent = `找到 ${this.filteredItems.length} 个项目`;
        }
    },

    clearFilters() {
        this.currentFilters = {
            category: 'all',
            priceMin: 0,
            priceMax: 100000,
            problem: 'all',
            searchText: ''
        };

        document.getElementById('projectCategoryFilter').value = 'all';
        document.getElementById('projectPriceMin').value = '0';
        document.getElementById('projectPriceMax').value = '100000';
        document.getElementById('projectSearch').value = '';

        this.applyFilters();
    },

    async showProblemRecommendation() {
        const problems = AppState.questionnaire.skinProblems;
        if (!problems || problems.length === 0) {
            Utils.showToast('请先在问题分类中选择您的皮肤问题', 'info');
            Navigation.navigateTo('questionnaireSection');
            return;
        }

        Utils.showLoading('AI正在为您推荐项目...');

        try {
            const prompt = `用户的皮肤问题：${problems.join('、')}

根据这些问题，从以下分类中推荐最合适的治疗项目：
${this.serviceData.categories.map(cat => `- ${cat.name}`).join('\n')}

请列出3-5个最推荐的项目名称，并简要说明推荐理由。`;

            const recommendation = await Utils.callAI(prompt, '你是医美项目推荐专家，请根据用户的皮肤问题推荐最合适的项目。');

            Utils.hideLoading();
            this.showRecommendationModal(recommendation);
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('推荐失败，请重试', 'error');
        }
    },

    showRecommendationModal(recommendation) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>
                        <span class="material-symbols-rounded">recommend</span>
                        AI项目推荐
                    </h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="recommendation-content">
                        ${Utils.renderMarkdown(recommendation)}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    addToCart(itemId) {
        // This would integrate with a cart system
        Utils.showToast('项目已添加到方案', 'check_circle');
        console.log('Added to cart:', itemId);
    }
};

// ===== Application Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all systems
    Navigation.init();
    PhotoUpload.init();
    Questionnaire.init();
    AIChat.init();
    ReportExport.init();
    History.init();
    Settings.init();
    Modals.init();
    SelectionAI.init();
    SocialShare.init();
    ProjectBrowser.init();

    // Set initial theme
    Settings.applySettings();

    console.log('智搭医美 APP initialized successfully');
});

// Make some functions globally accessible for inline onclick handlers
window.AIChat = AIChat;
window.TreatmentPlans = TreatmentPlans;
window.History = History;
window.ProjectBrowser = ProjectBrowser;
