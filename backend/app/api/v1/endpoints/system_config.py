# ## Imports ─────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any
from app.db.database import get_db
from app.core.deps import require_superadmin
from app.models.system_config import SystemConfig

router = APIRouter()


# ## 默认配置表（内置 Prompt & AI 参数，可在管理后台覆盖）────────────────
DEFAULT_CONFIGS = {

    # ## 题库生成
    "extract_questions_system": {
        "value": (
            "你是企业培训专家，精通知识点提炼与考核题目设计。"
            "你的核心能力是：从培训材料中识别关键知识点，将其转化为可考核的开放式问答题，"
            "并为每道题设计精准的分项得分点——使评分标准既覆盖核心要点，又能客观区分学员的掌握程度。"
        ),
        "description": "从材料提取题目时的 AI 角色定义（System Prompt）",
        "group": "题库生成",
    },
    "extract_questions_user": {
        "value": (
            "请从以下培训材料中提取 {question_count} 道问答题。\n\n"
            "## 出题要求\n"
            "1. 每道题围绕一个核心知识点，问法清晰、指向明确，适合口头作答\n"
            "2. 参考答案要完整准确，包含回答该题所需的全部关键信息\n"
            "3. 得分点设计规则：\n"
            "   - 每道题设置 2～5 个得分点，各得分点的 weight 之和等于该题 max_score\n"
            "   - 每个得分点描述一个可独立评估的核心概念或要点（10字以内）\n"
            "   - weight 体现该要点在满分中的分值权重\n"
            "   - match_type 统一使用 'semantic'（语义匹配，不要求逐字相符）\n"
            "4. 难度分布：easy 约30%、medium 约50%、hard 约20%\n"
            "5. 每题默认满分为 10 分，各得分点 weight 之和须等于 10\n\n"
            "## 材料内容\n"
            "{material_text}\n\n"
            "## 输出格式（严格JSON，不含任何额外说明）\n"
            '{{"questions": ['
            '{{"question_text": "题目内容", "answer_text": "完整参考答案", '
            '"score_points": [{{"keyword": "核心要点简述", "weight": 5, "match_type": "semantic"}}], '
            '"max_score": 10, "difficulty": "medium"}}'
            ']}}'
        ),
        "description": "生成题目的指令模板，{question_count} 和 {material_text} 由系统自动填入",
        "group": "题库生成",
    },

    # ## 知识问答评分
    "qa_score_system": {
        "value": (
            "你是企业培训评分专家，具备深度语义理解能力。"
            "评分核心原则：不拘泥于字面关键词匹配，通过语义理解判断学员是否真正表达了得分点所要求的核心含义——"
            "即使学员使用了不同词汇或表达方式，只要含义相符即视为命中。"
            "评语要温暖客观，先肯定命中的内容，再指出遗漏要点，帮助学员清楚认识自身的掌握情况和提升方向。"
        ),
        "description": "知识问答评分时的 AI 角色定义（System Prompt）",
        "group": "知识问答",
    },
    "qa_score_user": {
        "value": (
            "请对以下学员的口头回答进行评分和点评。\n\n"
            "【题目】{question_text}\n\n"
            "【参考答案】{answer_text}\n\n"
            "【得分点配置】{score_points}\n\n"
            "【学员实际回答】{user_answer}\n\n"
            "【本题满分】{max_score} 分\n\n"
            "## 评分规则\n"
            "- 以语义理解为准，判断学员回答是否实质上涵盖了各得分点的核心含义\n"
            "- 每个得分点只有全中（得该点 weight 分）或未中（得 0 分）两种状态\n"
            "- 各得分点得分之和即为最终 score\n"
            "- feedback：先用一句话肯定命中的要点，再明确指出遗漏的关键内容；80字以内\n"
            "- reference_answer：用1-2句话提炼参考答案的核心要点，供学员对照学习；60字以内\n\n"
            "## 输出格式（严格JSON）\n"
            '{{"score": 最终得分, "max_score": {max_score}, '
            '"partial_scores": [{{"point": "得分点简述", "hit": true或false, "score": 实际得分, "max": 该点weight}}], '
            '"feedback": "评语（先肯定再改进，80字以内）", '
            '"reference_answer": "参考答案核心要点（60字以内）"}}'
        ),
        "description": "问答评分的指令模板，题目/答案/学员回答等由系统自动填入",
        "group": "知识问答",
    },

    # ## 知识问答综合评估
    "qa_overall_eval_system": {
        "value": (
            "你是企业培训评估专家。在学员完成一组知识问答后，"
            "你需要根据其整体答题表现给出专业的综合评估，"
            "帮助学员清晰了解自己的知识掌握现状，并提供具体可行的提升建议。"
        ),
        "description": "知识问答整体完成后综合评估的 AI 角色定义（System Prompt）",
        "group": "知识问答",
    },
    "qa_overall_eval_user": {
        "value": (
            "学员已完成本次知识问答，请根据以下信息生成综合评估报告。\n\n"
            "## 答题概况\n"
            "总得分：{total_score} / {max_score} 分\n"
            "共答题：{question_count} 道\n\n"
            "## 各题答题情况\n"
            "{answer_details}\n\n"
            "## 评估要求\n"
            "- summary：综合评价整体表现，指出强项和薄弱环节，语气鼓励（120字以内）\n"
            "- strengths：本次表现突出的方面，具体到知识点（1-3条）\n"
            "- improvements：需要重点复习的知识点或答题能力（1-3条，具体可执行）\n"
            "- suggestion：给学员的个性化学习建议（60字以内，实用可操作）\n\n"
            "## 输出格式（严格JSON）\n"
            '{{"summary": "综合评价", '
            '"strengths": ["优点1", "优点2"], '
            '"improvements": ["待提升点1", "待提升点2"], '
            '"suggestion": "学习建议"}}'
        ),
        "description": "知识问答综合评估的指令模板，答题情况由系统自动填入",
        "group": "知识问答",
    },

    # ## 虚拟角色画像
    "generate_persona_system": {
        "value": (
            "你是资深的培训角色设计师，精通大五人格模型（OCEAN）在商业沟通场景中的应用。"
            "你的任务是：基于人物基础信息，推导出一个真实可信、个性鲜明的虚拟客户画像，"
            "使其能够在对话中呈现符合自身背景、性格和利益诉求的行为模式，"
            "让销售/服务培训学员感受到接近真实客户的互动体验。"
            "画像须有内在一致性：大五人格各维度分数须与性格描述、情绪反应模式相互印证。"
        ),
        "description": "生成虚拟角色画像时的 AI 角色定义（System Prompt）",
        "group": "虚拟角色",
    },
    "generate_persona_user": {
        "value": (
            "# 任务\n"
            "请根据以下角色基础信息，基于大五人格模型（OCEAN）推导该角色的完整行为画像，输出严格JSON。\n\n"
            "## 角色基础信息\n"
            "{persona_info}\n\n"
            "## 各字段说明与要求\n"
            "- role_name：中文姓名 + 称呼（如：张建国 张总），体现行业地位和称谓习惯\n"
            "- role_description：角色整体描述，涵盖职业背景、行业地位和典型工作状态（100字以内）\n"
            "- experience：从业经历，包括年限、重要经历、积累的专业判断力（80字以内）\n"
            "- position：职位头衔及职责范围，体现其决策权和关注层面\n"
            "- motivation：核心动机，即该角色在商业合作/购买决策中最根本的利益驱动（80字以内）\n"
            "- focus：关注重点，即沟通时最在意的3-5个具体方面，体现其决策优先排序（80字以内）\n"
            "- emotional_response_mode：情绪反应模式，面对压力、异议或不确定性时的典型行为反应（80字以内）\n"
            "- big_five：大五人格各维度评分（0-10整数），须与性格描述一致，不要使用统一的5/5/5/5/5：\n"
            "  openness（开放性）、conscientiousness（尽责性）、extraversion（外向性）、\n"
            "  agreeableness（亲和性）、neuroticism（神经质/情绪稳定性）\n\n"
            "## 注意\n"
            "- 各字段内容要相互印证、逻辑自洽\n"
            "- 内容紧扣培训对练场景，使角色在对话中有清晰可预期的行为模式\n\n"
            "严格按以下JSON格式返回：\n"
            '{{'
            '"role_name": "张建国 张总",'
            '"role_description": "...",'
            '"experience": "...",'
            '"position": "...",'
            '"motivation": "...",'
            '"focus": "...",'
            '"emotional_response_mode": "...",'
            '"big_five": {{"openness": 6, "conscientiousness": 8, "extraversion": 5, "agreeableness": 4, "neuroticism": 3}}'
            '}}'
        ),
        "description": "生成角色画像的指令模板，{persona_info} 由系统自动填入",
        "group": "虚拟角色",
    },

    # ## 模拟对练
    "roleplay_behavior_instructions": {
        "value": (
            "## 角色扮演行为准则\n\n"
            "**基本原则**\n"
            "- 始终以角色身份用第一人称说话，绝不说「作为AI」之类的话，不主动透露角色设定\n"
            "- 严格依据角色画像的性格、动机和关注重点做出反应，保持全程角色一致性\n"
            "- 用自然口语化的中文对话，回复长度控制在80字以内\n\n"
            "**对话行为**\n"
            "- 根据角色性格对学员说法保持适度的审视和怀疑，不要轻易被说服\n"
            "- 主动提出与角色关注重点相关的问题，推动话题向纵深发展\n"
            "- 对模糊或回避性的回答追问具体细节，不接受含糊其辞\n"
            "- 当学员表现专业时给予适度积极信号；表现不足时流露顾虑或保持观望\n"
            "- 保持连贯的态度演变：从初始的审慎，随学员表现逐渐开放或维持抵触\n\n"
            "**自然结束时机（以对话质量为准，非机械计轮次）**\n"
            "- 话题已完整经历「引入→深入探讨→处理顾虑→明确态度」完整弧线时\n"
            "- 角色的核心关注点已得到充分回应，继续对话不会产生新信息时\n"
            "- 角色已表达清晰的最终立场（无论正面还是负面）时\n"
            "- 通常在 10-20 轮对话后自然出现，极短或极长对话视情况提前/延后\n"
            "- 结束方式：以角色身份说一句自然的收尾话（如：好，我了解了，我回头考虑一下），"
            "然后在回复末尾单独另起一行加上 [END_SIGNAL]"
        ),
        "description": "对练中 AI 角色的行为规则（追加在角色信息之后，不替换角色信息）",
        "group": "模拟对练",
    },
    "roleplay_eval_system": {
        "value": (
            "你是专业的销售与服务沟通培训评估专家，擅长从模拟对练对话中识别学员的专业技巧、"
            "沟通策略和成长空间。你的评估要具体、有建设性，"
            "让学员清楚知道自己在哪些方面表现出色、哪些方面需要重点提升，"
            "并给出可以立即应用的改进建议。"
        ),
        "description": "对练结束综合评估时的 AI 角色定义（System Prompt）",
        "group": "模拟对练",
    },
    "roleplay_eval_user": {
        "value": (
            "请对以下模拟对练进行专业、严格的评估。\n\n"
            "【训练目标】{objective}\n\n"
            "【完整对话记录】\n{history}\n\n"
            "## 评分原则（必须严格遵守）\n"
            "- **基于证据**：每个维度的评分必须从对话原文中找到具体支撑，不得凭主观印象打分\n"
            "- **严格标准**：60分代表基本合格；70-80分表示有明显专业表现；90分以上须有突出亮点\n"
            "- **惩罚规则**：对话少于3轮有效发言的，综合得分不超过45分；学员回答敷衍（单字/无意义/偏题）的，对应维度不超过35分\n"
            "- **禁止虚高**：避免宽松打分或鼓励性虚高，评估的核心目的是帮助学员发现真实差距\n\n"
            "## 评估维度说明\n"
            "1. **开场与建立信任**（0-100）：开场是否自然流畅，能否快速建立专业形象和对话氛围\n"
            "2. **需求挖掘与倾听**（0-100）：是否有效提问、主动倾听，准确理解对方关注点\n"
            "3. **表达与说服能力**（0-100）：逻辑是否清晰，能否将产品/方案与对方需求精准匹配\n"
            "4. **异议处理**（0-100）：面对质疑或反驳时，能否冷静分析并给出有说服力的回应\n"
            "5. **推进与收尾**（0-100）：是否适时推进对话进程，结尾是否清晰有力\n\n"
            "## 输出格式（严格JSON）\n"
            '{{"score": 综合得分0-100, "max_score": 100, '
            '"dimensions": ['
            '{{"name": "开场与建立信任", "score": 分数, "max": 100, "comment": "引用原文1-2句说明得分依据"}},'
            '{{"name": "需求挖掘与倾听", "score": 分数, "max": 100, "comment": "引用原文1-2句说明得分依据"}},'
            '{{"name": "表达与说服能力", "score": 分数, "max": 100, "comment": "引用原文1-2句说明得分依据"}},'
            '{{"name": "异议处理", "score": 分数, "max": 100, "comment": "引用原文1-2句说明得分依据"}},'
            '{{"name": "推进与收尾", "score": 分数, "max": 100, "comment": "引用原文1-2句说明得分依据"}}'
            '], '
            '"summary": "综合评价，指出最突出的优势和最关键的提升点，语气客观（150字以内）", '
            '"strengths": ["具体优点（须有对话原文佐证）1", "具体优点2"], '
            '"improvements": ["具体且可操作的改进建议1", "改进建议2"], '
            '"next_focus": "下次对练前最值得专项练习的一件事（30字以内）"}}'
        ),
        "description": "对练评估的指令模板，{objective} 和 {history} 由系统自动填入",
        "group": "模拟对练",
    },
    "roleplay_difficulty_easy": {
        "value": (
            "当前对练难度：入门级\n"
            "- 角色以普通客户身份参与，不主动使用或追问专业术语\n"
            "- 提出的问题以常识性、生活化为主，贴近非专业人士的关注点\n"
            "- 态度相对开放友好，对合理的解释接受度较高，不设置刁钻陷阱\n"
            "- 遇到不理解的内容会直接说不懂，而不是深入追问\n"
            "- 顾虑主要集中在价格、使用便捷性、售后保障等基础方面"
        ),
        "description": "入门级难度：角色行为偏友好，问题基础，适合新手练习",
        "group": "模拟对练",
    },
    "roleplay_difficulty_medium": {
        "value": (
            "当前对练难度：进阶级\n"
            "- 角色具备行业基本认知，会提出有一定深度的问题，但不超出普通商务客户的认知范围\n"
            "- 态度中立客观，需要较充分的论据和具体细节才会被说服\n"
            "- 会追问方案的可行性、实施细节和效果保障\n"
            "- 遇到模糊的回答会适当追问，但不会刻意刁难\n"
            "- 顾虑涉及效果、成本、实施风险和与现有工作流程的配合"
        ),
        "description": "进阶级难度：角色有一定专业背景，问题有深度，适合有基础的学员",
        "group": "模拟对练",
    },
    "roleplay_difficulty_hard": {
        "value": (
            "当前对练难度：专家级\n"
            "- 角色是该领域资深专家或高层决策者，具备丰富的行业经验和较强的专业判断力\n"
            "- 态度严苛审慎，对泛泛而谈和缺乏依据的说法明显不满，需要精准、专业的应对\n"
            "- 会主动提出尖锐问题，挑战方案的细节、数据和执行逻辑\n"
            "- 对行业通行做法非常熟悉，虚假或夸大的说法容易被识破\n"
            "- 决策标准高，轻易不表态，对达不到预期的回答会明确表示存疑或拒绝推进"
        ),
        "description": "专家级难度：角色为资深专家，问题犀利，要求高，适合高阶实战训练",
        "group": "模拟对练",
    },

    # ## AI 参数
    "llm_model": {
        "value": "qwen-plus",
        "description": "LLM 模型名称（qwen-plus / qwen-turbo / qwen-max）",
        "group": "AI参数",
    },
    "llm_temperature": {
        "value": "0.7",
        "description": "Temperature（0.0-2.0，评分建议 0.3，对练建议 0.8）",
        "group": "AI参数",
    },
    "llm_max_tokens": {
        "value": "2000",
        "description": "单次最大输出 Token 数",
        "group": "AI参数",
    },
    "qa_pass_score": {
        "value": "60",
        "description": "知识问答通过分数线（0-100）",
        "group": "AI参数",
    },
    "roleplay_pass_score": {
        "value": "70",
        "description": "模拟对练通过分数线（0-100）",
        "group": "AI参数",
    },
    "platform_name": {
        "value": "AI 陪练",
        "description": "平台显示名称",
        "group": "AI参数",
    },
}


# ## 辅助函数：从 DB 读取单个配置（带默认值回退）────────────────────────
async def get_config_value(db: AsyncSession, key: str) -> str:
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
    row = result.scalar_one_or_none()
    if row and row.value is not None:
        return row.value
    return DEFAULT_CONFIGS.get(key, {}).get("value", "")


# ## API Endpoints ─────────────────────────────────────────────────────────
@router.get("")
async def get_all_configs(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
) -> Any:
    result = await db.execute(select(SystemConfig))
    db_map = {r.key: r for r in result.scalars().all()}

    configs = []
    for key, meta in DEFAULT_CONFIGS.items():
        row = db_map.get(key)
        configs.append({
            "key": key,
            "value": row.value if row else meta["value"],
            "description": meta["description"],
            "group": meta.get("group", "其他"),
            "updated_at": row.updated_at.isoformat() if row and row.updated_at else None,
        })
    return {"items": configs}


@router.put("/{key}")
async def update_config(
    key: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
) -> Any:
    if key not in DEFAULT_CONFIGS:
        raise HTTPException(status_code=404, detail="Config key not found")

    result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
    row = result.scalar_one_or_none()
    if row:
        row.value = payload.get("value", row.value)
    else:
        row = SystemConfig(key=key, value=payload.get("value", ""), description=DEFAULT_CONFIGS[key]["description"])
        db.add(row)
    await db.commit()
    await db.refresh(row)
    return {"key": row.key, "value": row.value, "updated_at": row.updated_at.isoformat() if row.updated_at else None}


@router.get("/public")
async def get_public_configs(db: AsyncSession = Depends(get_db)) -> Any:
    public_keys = ["platform_name", "qa_pass_score", "roleplay_pass_score"]
    result = await db.execute(select(SystemConfig).where(SystemConfig.key.in_(public_keys)))
    rows = {r.key: r.value for r in result.scalars().all()}
    return {k: rows.get(k, DEFAULT_CONFIGS[k]["value"]) for k in public_keys}
